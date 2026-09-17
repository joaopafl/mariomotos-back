import { Router, Request, Response } from "express";
import { usuarioService } from "../services/usuario.service";
import { autenticar, autorizar } from "../middlewares/autenticar.middleware";

const router = Router();

// Todas as rotas abaixo exigem perfil Administrador
router.use(autenticar);
router.use(autorizar("administrador"));

// Criar conta de funcionario ou administrador
router.post("/", async (req: Request, res: Response) => {
  try {
    const usuario = await usuarioService.criar(req.body);
    res.status(201).json(usuario);
  } catch (err) {
    res.status(400).json({ erro: (err as Error).message });
  }
});

router.get("/", async (_req: Request, res: Response) => {
  try {
    const usuarios = await usuarioService.listarTodos();
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ erro: (err as Error).message });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const usuario = await usuarioService.buscarPorId(req.params.id);
    if (!usuario) return res.status(404).json({ erro: "Usuario nao encontrado" });
    res.json(usuario);
  } catch (err) {
    res.status(500).json({ erro: (err as Error).message });
  }
});

// "Remover" funcionario = desativar (nao apaga o historico do que ele registrou)
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    await usuarioService.desativar(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ erro: (err as Error).message });
  }
});

router.put("/:id/reativar", async (req: Request, res: Response) => {
  try {
    await usuarioService.reativar(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ erro: (err as Error).message });
  }
});

export default router;
