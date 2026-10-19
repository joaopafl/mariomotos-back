import { Router, Request, Response } from "express";
import { relatorioResumoService } from "../services/relatorioResumo.service";
import { autenticar, autorizar } from "../middlewares/autenticar.middleware";

const router = Router();

router.use(autenticar);
router.use(autorizar("administrador"));

// Indicadores agregados do periodo (cards e graficos da tela de relatorios)
router.get("/resumo", async (req: Request, res: Response) => {
  try {
    const { inicio, fim } = req.query as { inicio: string; fim: string };
    res.json(await relatorioResumoService.resumo(inicio, fim));
  } catch (err) {
    res.status(400).json({ erro: (err as Error).message });
  }
});

export default router;
