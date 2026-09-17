import { Router, Request, Response } from "express";
import { relatorioService } from "../services/relatorio.service";
import { autenticar, autorizar } from "../middlewares/autenticar.middleware";

const router = Router();

router.use(autenticar);
router.use(autorizar("administrador"));

router.get("/faturamento", async (req: Request, res: Response) => {
  try {
    const { inicio, fim } = req.query as { inicio: string; fim: string };
    const relatorio = await relatorioService.faturamentoPorPeriodo(inicio, fim);
    res.json(relatorio);
  } catch (err) {
    res.status(400).json({ erro: (err as Error).message });
  }
});

router.get("/servicos", async (req: Request, res: Response) => {
  try {
    const { inicio, fim } = req.query as { inicio: string; fim: string };
    const servicos = await relatorioService.servicosPorPeriodo(inicio, fim);
    res.json(servicos);
  } catch (err) {
    res.status(400).json({ erro: (err as Error).message });
  }
});

router.get("/agendamentos", async (req: Request, res: Response) => {
  try {
    const { inicio, fim } = req.query as { inicio: string; fim: string };
    const agendamentos = await relatorioService.agendamentosPorPeriodo(inicio, fim);
    res.json(agendamentos);
  } catch (err) {
    res.status(400).json({ erro: (err as Error).message });
  }
});

export default router;
