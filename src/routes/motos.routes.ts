import { Router, Request, Response } from "express";
import { motoService } from "../services/moto.service";

import { autenticar, autorizar } from "../middlewares/autenticar.middleware";

const router = Router();

router.use(autenticar);

// RF04 - Cadastrar moto vinculada a um cliente
router.post("/", async (req: Request, res: Response) => {
  try {
    const moto = await motoService.criar(req.body);
    res.status(201).json(moto);
  } catch (err) {
    res.status(400).json({ erro: (err as Error).message });
  }
});

// RF15 - Listar motos de um cliente (suporte a multiplas motos)
router.get("/cliente/:clienteId", async (req: Request, res: Response) => {
  try {
    const motos = await motoService.listarPorCliente(req.params.clienteId);
    res.json(motos);
  } catch (err) {
    res.status(500).json({ erro: (err as Error).message });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const moto = await motoService.buscarPorId(req.params.id);
    if (!moto) return res.status(404).json({ erro: "Moto nao encontrada" });
    res.json(moto);
  } catch (err) {
    res.status(500).json({ erro: (err as Error).message });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    await motoService.atualizar(req.params.id, req.body);
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ erro: (err as Error).message });
  }
});

router.delete("/:id", autorizar("administrador"), async (req: Request, res: Response) => {
  try {
    await motoService.deletar(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ erro: (err as Error).message });
  }
});

export default router;
