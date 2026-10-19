import { Router, Request, Response } from "express";
import { Types } from "mongoose";
import { agendamentoService } from "../services/agendamento.service";
import { horarioService } from "../services/horario.service";
import { notificacaoService } from "../services/notificacao.service";
import { autenticar, autorizar } from "../middlewares/autenticar.middleware";
import { IAgendamento } from "../models/Agendamento";
import { Cliente } from "../models/Cliente";
import { Moto } from "../models/Moto";
import { TipoServico } from "../models/TipoServico";
import { Servico } from "../models/Servico";

const router = Router();

router.use(autenticar);

function dataBr(iso: string): string {
  return `${iso.substring(8, 10)}/${iso.substring(5, 7)}/${iso.substring(0, 4)}`;
}

// Devolve o agendamento junto com a hora do servidor, para o cronometro do app nao depender do relogio do celular
function comHoraDoServidor(ag: IAgendamento) {
  return { ...ag.toObject(), agoraServidor: new Date().toISOString() };
}

// RF09/RF21 - Criar agendamento (RN03/RF11 - validado dentro do service)
// RN13: se quem esta autenticado e Cliente, o clienteId e forcado a ser ele mesmo.
// Cliente so agenda em horario liberado pelo administrador; a equipe pode fazer encaixe.
router.post("/", async (req: Request, res: Response) => {
  try {
    const dados = { ...req.body };
    if (req.usuarioAutenticado?.perfil === "cliente") {
      dados.clienteId = req.usuarioAutenticado.id;
      if (!(await horarioService.existe(dados.data, dados.horario))) {
        return res.status(409).json({ erro: "Horario indisponivel. Escolha um horario liberado." });
      }
    }
    const agendamento = await agendamentoService.criar(dados);
    res.status(201).json(agendamento);
  } catch (err) {
    res.status(409).json({ erro: (err as Error).message });
  }
});

// RF10 - Agenda do dia
router.get("/dia/:data", async (req: Request, res: Response) => {
  try {
    const agendamentos = await agendamentoService.listarPorDia(req.params.data);
    res.json(agendamentos);
  } catch (err) {
    res.status(500).json({ erro: (err as Error).message });
  }
});

// RF12 - Agendamentos futuros do cliente
router.get("/cliente/:clienteId", async (req: Request, res: Response) => {
  try {
    const agendamentos = await agendamentoService.listarPorCliente(req.params.clienteId);
    res.json(agendamentos);
  } catch (err) {
    res.status(500).json({ erro: (err as Error).message });
  }
});

// Quantos atendimentos o funcionario logado finalizou neste mes (card do dashboard)
router.get("/atendimentos/mes", autorizar("funcionario"), async (req: Request, res: Response) => {
  try {
    const quantidade = await agendamentoService.contarFinalizadosNoMes(req.usuarioAutenticado!.id);
    res.json({ quantidade });
  } catch (err) {
    res.status(500).json({ erro: (err as Error).message });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const agendamento = await agendamentoService.buscarPorId(req.params.id);
    if (!agendamento) return res.status(404).json({ erro: "Agendamento nao encontrado" });
    const usuario = req.usuarioAutenticado;
    if (usuario?.perfil === "cliente" && String(agendamento.clienteId) !== usuario.id) {
      return res.status(403).json({ erro: "Voce so pode ver os seus agendamentos." });
    }
    // Junta os dados da moto e do cliente, para a tela de detalhes nao depender de outras rotas
    const [cliente, moto, tipo, servicos] = await Promise.all([
      Cliente.findById(agendamento.clienteId).select("nome telefone email").lean(),
      Moto.findById(agendamento.motoId).select("modelo placa ano").lean(),
      TipoServico.findOne({ nome: agendamento.tipoServicoPrevisto }).select("valorPadrao").lean(),
      Servico.find({
        _id: {
          $in: [agendamento.servicoId, ...(agendamento.itensExtras ?? []).map((i) => i.servicoId)].filter(
            Boolean
          ) as Types.ObjectId[],
        },
      })
        .select("valor")
        .lean(),
    ]);
    // Os valores acompanham os servicos do historico, que o administrador pode ter corrigido
    const valorDe = new Map<string, number>(servicos.map((x) => [String(x._id), x.valor] as [string, number]));
    const itensExtras = (agendamento.itensExtras ?? []).map((i) => ({
      _id: i._id,
      tipoServico: i.tipoServico,
      adicionadoEm: i.adicionadoEm,
      valor: (i.servicoId && valorDe.get(String(i.servicoId))) ?? i.valor,
    }));
    const valorPrincipal = agendamento.servicoId
      ? valorDe.get(String(agendamento.servicoId)) ?? agendamentoService.valorDoPrincipal(agendamento)
      : undefined;
    const valorFinal = agendamento.finalizadoEm
      ? (valorPrincipal ?? 0) + itensExtras.reduce((t, i) => t + i.valor, 0)
      : undefined;
    res.json({
      ...comHoraDoServidor(agendamento),
      itensExtras,
      cliente,
      moto,
      valorTabelado: tipo?.valorPadrao ?? 0,
      valorPrincipal,
      valorFinal,
    });
  } catch (err) {
    res.status(500).json({ erro: (err as Error).message });
  }
});

// RN03 revalidado tambem na edicao, caso data/horario mudem
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const dados = { ...req.body };
    const usuario = req.usuarioAutenticado;

    if (usuario?.perfil === "funcionario") {
      return res.status(403).json({ erro: "Funcionario nao pode editar agendamentos. Fale com o administrador." });
    }

    if (usuario?.perfil === "cliente") {
      const existente = await agendamentoService.buscarPorId(req.params.id);
      if (!existente) return res.status(404).json({ erro: "Agendamento nao encontrado" });
      if (String(existente.clienteId) !== usuario.id) {
        return res.status(403).json({ erro: "Voce so pode alterar os seus agendamentos." });
      }
      if (existente.iniciadoEm) {
        return res.status(409).json({ erro: "Este atendimento ja foi iniciado e nao pode ser alterado." });
      }
      delete dados.clienteId; // cliente nao troca o dono do agendamento
      const mudouHorario =
        (dados.data && dados.data !== existente.data) ||
        (dados.horario && dados.horario !== existente.horario);
      if (mudouHorario) {
        const data = dados.data ?? existente.data;
        const horario = dados.horario ?? existente.horario;
        if (!(await horarioService.existe(data, horario))) {
          return res.status(409).json({ erro: "Horario indisponivel. Escolha um horario liberado." });
        }
      }
    }

    await agendamentoService.atualizar(req.params.id, dados);
    res.status(204).send();
  } catch (err) {
    res.status(409).json({ erro: (err as Error).message });
  }
});

// Atendimento: o funcionario inicia (comeca o cronometro)...
router.put("/:id/iniciar", autorizar("funcionario"), async (req: Request, res: Response) => {
  try {
    const agendamento = await agendamentoService.iniciar(req.params.id, req.usuarioAutenticado!);
    res.json(comHoraDoServidor(agendamento));
  } catch (err) {
    res.status(409).json({ erro: (err as Error).message });
  }
});

// ...e finaliza, informando as observacoes do que foi feito. O cliente recebe o aviso de servico pronto.
router.put("/:id/finalizar", autorizar("funcionario"), async (req: Request, res: Response) => {
  try {
    const brutoTempo = req.body?.duracaoMinutos;
    const duracao =
      brutoTempo === undefined || brutoTempo === null || brutoTempo === "" ? undefined : Number(brutoTempo);
    const agendamento = await agendamentoService.finalizar(
      req.params.id,
      req.usuarioAutenticado!,
      String(req.body?.observacoes ?? ""),
      duracao,
      String(req.body?.motivoAjuste ?? "")
    );
    const valorTexto = `R$ ${(agendamento.valorFinal ?? 0).toFixed(2).replace(".", ",")}`;
    void notificacaoService.avisarCliente(String(agendamento.clienteId), {
      titulo: "Seu serviço está pronto",
      corpo: `O serviço "${agendamento.tipoServicoPrevisto}" da sua moto foi finalizado (${valorTexto}). Pode retirá-la na MarioMotos.`,
      dados: { tipo: "servico_pronto", agendamentoId: String(agendamento._id) },
    });
    res.json(comHoraDoServidor(agendamento));
  } catch (err) {
    res.status(409).json({ erro: (err as Error).message });
  }
});

// O mecanico que esta atendendo inclui (ou remove) servicos do catalogo no atendimento
router.post("/:id/itens", autorizar("funcionario"), async (req: Request, res: Response) => {
  try {
    const ag = await agendamentoService.adicionarItem(
      req.params.id,
      req.usuarioAutenticado!,
      String(req.body?.tipoServicoId ?? "")
    );
    res.status(201).json(ag.itensExtras);
  } catch (err) {
    res.status(409).json({ erro: (err as Error).message });
  }
});

router.delete("/:id/itens/:itemId", autorizar("funcionario"), async (req: Request, res: Response) => {
  try {
    const ag = await agendamentoService.removerItem(req.params.id, req.usuarioAutenticado!, req.params.itemId);
    res.json(ag.itensExtras);
  } catch (err) {
    res.status(409).json({ erro: (err as Error).message });
  }
});

// Somente o administrador altera o valor de um atendimento ja finalizado
router.put("/:id/valor", autorizar("administrador"), async (req: Request, res: Response) => {
  try {
    const itemId = req.body?.itemId ? String(req.body.itemId) : undefined;
    const ag = await agendamentoService.ajustarValor(req.params.id, Number(req.body?.valor), itemId);
    res.json({ valorFinal: ag.valorFinal });
  } catch (err) {
    res.status(400).json({ erro: (err as Error).message });
  }
});

// Cancelamento: so o administrador (qualquer agendamento) ou o proprio cliente (os dele).
// O funcionario nao cancela. Quando o administrador cancela, o cliente e avisado.
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const usuario = req.usuarioAutenticado;
    if (usuario?.perfil === "funcionario") {
      return res.status(403).json({ erro: "Funcionario nao pode cancelar agendamentos. Fale com o administrador." });
    }

    const existente = await agendamentoService.buscarPorId(req.params.id);
    if (!existente) return res.status(404).json({ erro: "Agendamento nao encontrado" });
    if (usuario?.perfil === "cliente" && String(existente.clienteId) !== usuario.id) {
      return res.status(403).json({ erro: "Voce so pode cancelar os seus agendamentos." });
    }
    if (existente.iniciadoEm) {
      return res.status(409).json({ erro: "Este atendimento ja foi iniciado e nao pode ser cancelado." });
    }

    const removido = await agendamentoService.cancelar(req.params.id);
    if (removido && usuario?.perfil !== "cliente") {
      void notificacaoService.avisarCliente(String(removido.clienteId), {
        titulo: "Agendamento desmarcado",
        corpo: `Seu agendamento de ${dataBr(removido.data)} às ${removido.horario} (${removido.tipoServicoPrevisto}) foi desmarcado pela oficina. Entre no app para escolher um novo horário.`,
        dados: { tipo: "agendamento_cancelado", agendamentoId: String(removido._id) },
      });
    }
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ erro: (err as Error).message });
  }
});

export default router;
