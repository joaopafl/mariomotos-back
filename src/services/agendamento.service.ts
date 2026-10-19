import { Types } from "mongoose";
import { Agendamento, IAgendamento, IItemExtra } from "../models/Agendamento";
import { Moto } from "../models/Moto";
import { Servico } from "../models/Servico";
import { TipoServico } from "../models/TipoServico";
import { Usuario } from "../models/Usuario";
import { TokenPayload } from "./auth.service";
import { jaPassou } from "../utils/tempo";

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

    if (jaPassou(dados.data, dados.horario)) {
      throw new Error("Nao e possivel agendar para um horario que ja passou.");
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
    delete limpos.valorPrincipal;
    delete limpos.itensExtras;
    delete limpos.servicoId;
    delete limpos.duracaoMedidaSeg;
    delete limpos.duracaoFinalSeg;
    delete limpos.tempoAjustado;
    delete limpos.motivoAjusteTempo;
    delete limpos.lembreteEnviadoEm;

    // Nao permite remarcar para um horario que ja passou (so confere quando data/horario mudam)
    if (limpos.data || limpos.horario) {
      const atual = await Agendamento.findById(id);
      if (!atual) throw new Error("Agendamento nao encontrado.");
      const data = limpos.data ?? atual.data;
      const horario = limpos.horario ?? atual.horario;
      const mudou = data !== atual.data || horario !== atual.horario;
      if (mudou && jaPassou(data, horario)) {
        throw new Error("Nao e possivel remarcar para um horario que ja passou.");
      }
    }

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

  /** Soma do servico principal + extras. Atendimentos antigos nao tem valorPrincipal: deduz-se do total. */
  valorDoPrincipal(ag: IAgendamento): number {
    if (ag.valorPrincipal !== undefined && ag.valorPrincipal !== null) return ag.valorPrincipal;
    const extras = (ag.itensExtras ?? []).reduce((t, i) => t + i.valor, 0);
    return Math.max(0, (ag.valorFinal ?? 0) - extras);
  },

  /** O mecanico que esta atendendo inclui um servico do catalogo (valor tabelado, sem digitar). */
  async adicionarItem(id: string, usuario: TokenPayload, tipoServicoId: string): Promise<IAgendamento> {
    const ag = await Agendamento.findById(id);
    if (!ag) throw new Error("Agendamento nao encontrado.");
    if (!ag.iniciadoEm) throw new Error("Inicie o atendimento antes de adicionar servicos.");
    if (ag.finalizadoEm) throw new Error("Este atendimento ja foi finalizado.");
    if (String(ag.atendenteId) !== usuario.id) {
      throw new Error("Somente quem iniciou o atendimento pode adicionar servicos.");
    }
    if (!Types.ObjectId.isValid(tipoServicoId)) throw new Error("Servico invalido.");
    const tipo = await TipoServico.findById(tipoServicoId).lean();
    if (!tipo || tipo.ativo === false) throw new Error("Servico nao encontrado no catalogo.");
    if ((ag.itensExtras ?? []).length >= 30) throw new Error("Limite de servicos adicionais atingido.");
    ag.itensExtras = [
      ...(ag.itensExtras ?? []),
      { tipoServico: tipo.nome, valor: tipo.valorPadrao ?? 0, adicionadoEm: new Date() },
    ];
    await ag.save();
    return ag;
  },

  async removerItem(id: string, usuario: TokenPayload, itemId: string): Promise<IAgendamento> {
    const ag = await Agendamento.findById(id);
    if (!ag) throw new Error("Agendamento nao encontrado.");
    if (ag.finalizadoEm) throw new Error("Atendimento finalizado: so o administrador altera os servicos.");
    if (String(ag.atendenteId) !== usuario.id) {
      throw new Error("Somente quem iniciou o atendimento pode remover servicos.");
    }
    const antes = (ag.itensExtras ?? []).length;
    ag.itensExtras = (ag.itensExtras ?? []).filter((i) => String(i._id) !== itemId);
    if (ag.itensExtras.length === antes) throw new Error("Servico adicional nao encontrado.");
    await ag.save();
    return ag;
  },

  /** Administrador: altera o valor do servico principal ou de um adicional (atendimento finalizado). */
  async ajustarValor(id: string, valor: number, itemId?: string): Promise<IAgendamento> {
    if (!Number.isFinite(valor) || valor < 0) throw new Error("Valor do servico invalido.");
    const ag = await Agendamento.findById(id);
    if (!ag) throw new Error("Agendamento nao encontrado.");
    if (!ag.finalizadoEm) throw new Error("O valor so pode ser alterado depois que o atendimento for finalizado.");

    let principal = this.valorDoPrincipal(ag); // calculado antes de mexer nos itens
    if (itemId) {
      const item = (ag.itensExtras ?? []).find((i) => String(i._id) === itemId);
      if (!item) throw new Error("Servico adicional nao encontrado.");
      if (item.servicoId) await Servico.findByIdAndUpdate(item.servicoId, { valor });
      item.valor = valor;
    } else {
      principal = valor;
      if (ag.servicoId) await Servico.findByIdAndUpdate(ag.servicoId, { valor });
    }
    ag.valorPrincipal = principal;
    ag.valorFinal = principal + (ag.itensExtras ?? []).reduce((t, i) => t + i.valor, 0);
    await ag.save();
    return ag;
  },

  /** Quem iniciou o atendimento o finaliza, com as observacoes do que foi feito. */
  async finalizar(
    id: string,
    usuario: TokenPayload,
    observacoes: string,
    duracaoMinutos?: number,
    motivoAjuste?: string
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

    // O valor e sempre o tabelado do servico; so o administrador pode altera-lo depois (ajustarValor)
    // Tempo: o servidor mede (inicio a fim); o mecanico confirma ou corrige. Teto de 30 dias so evita erro de digitacao.
    const medidaSeg = Math.max(0, Math.round((Date.now() - ag.iniciadoEm.getTime()) / 1000));
    if (duracaoMinutos !== undefined && (!Number.isFinite(duracaoMinutos) || duracaoMinutos < 1 || duracaoMinutos > 30 * 24 * 60)) {
      throw new Error("Tempo de atendimento invalido. Informe de 1 minuto ate 30 dias.");
    }
    const finalSeg = duracaoMinutos !== undefined ? Math.round(duracaoMinutos * 60) : medidaSeg;
    const ajustado = Math.abs(finalSeg - medidaSeg) > 60;

    const tipo = await TipoServico.findOne({ nome: ag.tipoServicoPrevisto }).select("valorPadrao").lean();
    const valorPrincipal = tipo?.valorPadrao ?? 0;

    // Entra no historico de servicos da moto (consultas e relatorios): um registro por servico executado
    const servico = await Servico.create({
      motoId: ag.motoId,
      tipoServico: ag.tipoServicoPrevisto,
      data: ag.data,
      valor: valorPrincipal,
      observacoes: texto,
    });
    const extras: IItemExtra[] = [];
    for (const item of ag.itensExtras ?? []) {
      const criado = await Servico.create({
        motoId: ag.motoId,
        tipoServico: item.tipoServico,
        data: ag.data,
        valor: item.valor,
        observacoes: `Adicional no atendimento: ${texto}`,
      });
      extras.push({
        _id: item._id,
        tipoServico: item.tipoServico,
        valor: item.valor,
        adicionadoEm: item.adicionadoEm,
        servicoId: criado._id as Types.ObjectId,
      });
    }
    const valorFinal = valorPrincipal + extras.reduce((t, i) => t + i.valor, 0);

    ag.finalizadoEm = new Date();
    ag.observacoesAtendimento = texto;
    ag.valorPrincipal = valorPrincipal;
    ag.itensExtras = extras;
    ag.valorFinal = valorFinal;
    ag.duracaoMedidaSeg = medidaSeg;
    ag.duracaoFinalSeg = finalSeg;
    ag.tempoAjustado = ajustado;
    if (ajustado && motivoAjuste && motivoAjuste.trim()) ag.motivoAjusteTempo = motivoAjuste.trim();
    ag.servicoId = servico._id as Types.ObjectId;
    await ag.save();
    return ag;
  },
};
