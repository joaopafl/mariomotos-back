import { Router, Request, Response } from "express";
import { servicoService } from "../services/servico.service";
import { autenticar, autorizar } from "../middlewares/autenticar.middleware";

const router = Router();

router.use(autenticar);

// Admin: todos os servicos realizados
router.get("/", autorizar("administrador"), async (_req: Request, res: Response) => {
  try {
    res.json(await servicoService.listarTodos());
  } catch (err) {
    res.status(500).json({ erro: (err as Error).message });
  }
});

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

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const servico = await servicoService.buscarPorId(req.params.id);
    if (!servico) return res.status(404).json({ erro: "Servico nao encontrado" });
    res.json(servico);
  } catch (err) {
    res.status(500).json({ erro: (err as Error).message });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    await servicoService.atualizar(req.params.id, req.body);
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ erro: (err as Error).message });
  }
});

// Desativar / reativar (nunca exclui) - somente administrador
router.put("/:id/desativar", autorizar("administrador"), async (req: Request, res: Response) => {
  try {
    await servicoService.desativar(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ erro: (err as Error).message });
  }
});

router.put("/:id/reativar", autorizar("administrador"), async (req: Request, res: Response) => {
  try {
    await servicoService.reativar(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ erro: (err as Error).message });
  }
});

export default router;
