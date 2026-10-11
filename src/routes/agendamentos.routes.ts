import { Router, Request, Response } from "express";
import { agendamentoService } from "../services/agendamento.service";
import { horarioService } from "../services/horario.service";
import { autenticar } from "../middlewares/autenticar.middleware";

const router = Router();

router.use(autenticar);

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

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const agendamento = await agendamentoService.buscarPorId(req.params.id);
    if (!agendamento) return res.status(404).json({ erro: "Agendamento nao encontrado" });
    res.json(agendamento);
  } catch (err) {
    res.status(500).json({ erro: (err as Error).message });
  }
});

// RN03 revalidado tambem na edicao, caso data/horario mudem
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const dados = { ...req.body };
    const usuario = req.usuarioAutenticado;

    if (usuario?.perfil === "cliente") {
      const existente = await agendamentoService.buscarPorId(req.params.id);
      if (!existente) return res.status(404).json({ erro: "Agendamento nao encontrado" });
      if (String(existente.clienteId) !== usuario.id) {
        return res.status(403).json({ erro: "Voce so pode alterar os seus agendamentos." });
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

// Cancelamento: a equipe cancela qualquer um; o cliente so os proprios
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const usuario = req.usuarioAutenticado;
    if (usuario?.perfil === "cliente") {
      const existente = await agendamentoService.buscarPorId(req.params.id);
      if (existente && String(existente.clienteId) !== usuario.id) {
        return res.status(403).json({ erro: "Voce so pode cancelar os seus agendamentos." });
      }
    }
    await agendamentoService.cancelar(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ erro: (err as Error).message });
  }
});

export default router;
