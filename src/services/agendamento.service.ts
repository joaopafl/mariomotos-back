import { Types } from "mongoose";
import { Agendamento, IAgendamento } from "../models/Agendamento";
import { Moto } from "../models/Moto";
import { Servico } from "../models/Servico";
import { TipoServico } from "../models/TipoServico";
import { Usuario } from "../models/Usuario";
import { TokenPayload } from "./auth.service";

const ANTECEDENCIA_INICIO_HORAS = 2;

export const agendamentoService = {
  async criar(dados: Partial<IAgendamento>): Promise<IAgendamento> {
    // RN07: moto deve pertencer ao cliente informado (tambem sustenta a RN13,
    // quando o proprio Cliente cria o agendamento a partir do app)
    const moto = await Moto.findById(dados.motoId);
    if (!moto) {
      throw new Error("Motocicleta nao encontrada.");
    }
    if (String(moto.clienteId) !== String(dados.clienteId)) {
      throw new Error("Esta motocicleta nao pertence ao cliente informado.");
    }

    // RN03 / RF11: nao permitir dois agendamentos no mesmo horario
    const conflito = await Agendamento.findOne({ data: dados.data, horario: dados.horario });
    if (conflito) {
      throw new Error("Ja existe um agendamento nesse horario. Escolha outro horario.");
    }
    return Agendamento.create(dados);
  },

  async listarPorDia(data: string): Promise<IAgendamento[]> {
    return Agendamento.find({ data }).sort({ horario: 1 });
  },

  async listarPorCliente(clienteId: string): Promise<IAgendamento[]> {
    return Agendamento.find({ clienteId }).sort({ data: 1 });
  },

  async buscarPorId(id: string): Promise<IAgendamento | null> {
    return Agendamento.findById(id);
  },

  async atualizar(id: string, dados: Partial<IAgendamento>): Promise<void> {
    // Os campos do atendimento so mudam pelas rotas de iniciar e finalizar
    const limpos: Partial<IAgendamento> = { ...dados };
    delete limpos.iniciadoEm;
    delete limpos.finalizadoEm;
    delete limpos.atendenteId;
    delete limpos.atendenteNome;
    delete limpos.atendenteTitulo;
    delete limpos.observacoesAtendimento;
    delete limpos.valorFinal;
    delete limpos.servicoId;
    delete limpos.lembreteEnviadoEm;

    // RN03 revalidado tambem na edicao, caso data/horario mudem
    if (limpos.data && limpos.horario) {
      const conflito = await Agendamento.findOne({
        _id: { $ne: id },
        data: limpos.data,
        horario: limpos.horario,
      });
      if (conflito) {
        throw new Error("Ja existe um agendamento nesse horario. Escolha outro horario.");
      }
    }
    await Agendamento.findByIdAndUpdate(id, limpos);
  },

  /** Remove o agendamento e devolve o que foi removido (para avisar o cliente). */
  async cancelar(id: string): Promise<IAgendamento | null> {
    return Agendamento.findByIdAndDelete(id);
  },

  /** O funcionario inicia o atendimento: grava o horario de inicio e quem esta atendendo. */
  async iniciar(id: string, usuario: TokenPayload): Promise<IAgendamento> {
    const ag = await Agendamento.findById(id);
    if (!ag) throw new Error("Agendamento nao encontrado.");
    if (ag.iniciadoEm) throw new Error("Este atendimento ja foi iniciado.");

    // So pode iniciar no dia marcado e com no maximo 2 horas de antecedencia (Brasil sem horario de verao: UTC-3)
    const marcado = new Date(`${ag.data}T${ag.horario}:00-03:00`);
    const liberadoEm = new Date(marcado.getTime() - ANTECEDENCIA_INICIO_HORAS * 60 * 60 * 1000);
    const hoje = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
    if (ag.data !== hoje) {
      throw new Error("O atendimento so pode ser iniciado no dia do agendamento.");
    }
    if (Date.now() < liberadoEm.getTime()) {
      const hora = new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).format(liberadoEm);
      throw new Error(`Ainda nao e possivel iniciar. Disponivel a partir das ${hora}.`);
    }

    const atendente = await Usuario.findById(usuario.id);
    ag.iniciadoEm = new Date();
    ag.atendenteId = new Types.ObjectId(usuario.id);
    ag.atendenteNome = atendente?.nome ?? usuario.nome;
    ag.atendenteTitulo = atendente?.titulo ?? "";
    await ag.save();
    return ag;
  },

  /** Quantos atendimentos o funcionario finalizou no mes corrente (mes civil em Sao Paulo, UTC-3). */
  async contarFinalizadosNoMes(atendenteId: string): Promise<number> {
    const hoje = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
    const [ano, mes] = hoje.split("-").map(Number);
    const proximoAno = mes === 12 ? ano + 1 : ano;
    const proximoMes = mes === 12 ? 1 : mes + 1;
    const dois = (n: number) => String(n).padStart(2, "0");
    const inicio = new Date(`${ano}-${dois(mes)}-01T00:00:00-03:00`);
    const fim = new Date(`${proximoAno}-${dois(proximoMes)}-01T00:00:00-03:00`);
    return Agendamento.countDocuments({
      atendenteId: new Types.ObjectId(atendenteId),
      finalizadoEm: { $gte: inicio, $lt: fim },
    });
  },

  /** Quem iniciou o atendimento o finaliza, com as observacoes do que foi feito. */
  async finalizar(
    id: string,
    usuario: TokenPayload,
    observacoes: string,
    valor?: number
  ): Promise<IAgendamento> {
    const ag = await Agendamento.findById(id);
    if (!ag) throw new Error("Agendamento nao encontrado.");
    if (!ag.iniciadoEm) throw new Error("Inicie o atendimento antes de finalizar.");
    if (ag.finalizadoEm) throw new Error("Este atendimento ja foi finalizado.");
    if (String(ag.atendenteId) !== usuario.id) {
      throw new Error("Somente quem iniciou o atendimento pode finaliza-lo.");
    }
    const texto = (observacoes || "").trim();
    if (!texto) throw new Error("Preencha as observacoes do atendimento.");

    // O valor vem tabelado pelo servico escolhido; o mecanico pode ajustar apos a vistoria no local
    if (valor !== undefined && (!Number.isFinite(valor) || valor < 0)) {
      throw new Error("Valor do servico invalido.");
    }
    const tipo = await TipoServico.findOne({ nome: ag.tipoServicoPrevisto }).select("valorPadrao").lean();
    const valorFinal = valor !== undefined ? valor : tipo?.valorPadrao ?? 0;

    // Entra no historico de servicos da moto (consultas e relatorios)
    const servico = await Servico.create({
      motoId: ag.motoId,
      tipoServico: ag.tipoServicoPrevisto,
      data: ag.data,
      valor: valorFinal,
      observacoes: texto,
    });

    ag.finalizadoEm = new Date();
    ag.observacoesAtendimento = texto;
    ag.valorFinal = valorFinal;
    ag.servicoId = servico._id as Types.ObjectId;
    await ag.save();
    return ag;
  },
};
