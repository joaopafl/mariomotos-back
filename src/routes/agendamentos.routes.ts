import { Router, Request, Response } from "express";
import { agendamentoService } from "../services/agendamento.service";

const router = Router();

// RF09 - Criar agendamento (RN03/RF11 - validado dentro do service)
router.post("/", async (req: Request, res: Response) => {
  try {
    const agendamento = await agendamentoService.criar(req.body);
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

export default router;
