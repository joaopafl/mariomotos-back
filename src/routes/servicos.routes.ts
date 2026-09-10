import { Router, Request, Response } from "express";
import { servicoService } from "../services/servico.service";

const router = Router();

// RF07 - Registrar servico prestado
router.post("/", async (req: Request, res: Response) => {
  try {
    const servico = await servicoService.criar(req.body);
    res.status(201).json(servico);
  } catch (err) {
    res.status(400).json({ erro: (err as Error).message });
  }
});

// RF08 - Historico de servicos por moto
router.get("/moto/:motoId", async (req: Request, res: Response) => {
  try {
    const servicos = await servicoService.listarPorMoto(req.params.motoId);
    res.json(servicos);
  } catch (err) {
    res.status(500).json({ erro: (err as Error).message });
  }
});

export default router;
