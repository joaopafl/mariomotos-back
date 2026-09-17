import { Router, Request, Response } from "express";
import { agendamentoService } from "../services/agendamento.service";
import { autenticar } from "../middlewares/autenticar.middleware";

const router = Router();

router.use(autenticar);

// RF09/RF21 - Criar agendamento (RN03/RF11 - validado dentro do service)
// RN13: se quem esta autenticado e Cliente, o clienteId e forcado a ser ele mesmo,
// ignorando qualquer clienteId diferente enviado no corpo da requisicao.
router.post("/", async (req: Request, res: Response) => {
  try {
    const dados = { ...req.body };
    if (req.usuarioAutenticado?.perfil === "cliente") {
      dados.clienteId = req.usuarioAutenticado.id;
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
    await agendamentoService.atualizar(req.params.id, req.body);
    res.status(204).send();
  } catch (err) {
    res.status(409).json({ erro: (err as Error).message });
  }
});

// Cancelamento de agendamento e tarefa rotineira, nao exclusiva do Administrador
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    await agendamentoService.cancelar(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ erro: (err as Error).message });
  }
});

export default router;
