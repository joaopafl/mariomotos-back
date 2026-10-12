import { Router, Request, Response } from "express";
import { tipoServicoService } from "../services/tipoServico.service";
import { autenticar, autorizar } from "../middlewares/autenticar.middleware";

const router = Router();

router.use(autenticar);

// Qualquer usuario logado consulta o catalogo. Administrador ve tambem os
// desativados (para poder reativar); os demais veem so os ativos.
router.get("/", async (req: Request, res: Response) => {
  try {
    const ehAdmin = req.usuarioAutenticado?.perfil === "administrador";
    res.json(await tipoServicoService.listarTodos(!ehAdmin));
  } catch (err) {
    res.status(500).json({ erro: (err as Error).message });
  }
});

// Somente administrador cadastra, edita e desativa
router.post("/", autorizar("administrador"), async (req: Request, res: Response) => {
  try {
    const criado = await tipoServicoService.criar(req.body);
    res.status(201).json(criado);
  } catch (err) {
    const msg = (err as any).code === 11000 ? "Ja existe um servico com esse nome." : (err as Error).message;
    res.status(400).json({ erro: msg });
  }
});

router.put("/:id", autorizar("administrador"), async (req: Request, res: Response) => {
  try {
    await tipoServicoService.atualizar(req.params.id, req.body);
    res.status(204).send();
  } catch (err) {
    const msg = (err as any).code === 11000 ? "Ja existe um servico com esse nome." : (err as Error).message;
    res.status(400).json({ erro: msg });
  }
});

// Desativar / reativar (nunca exclui)
router.put("/:id/desativar", autorizar("administrador"), async (req: Request, res: Response) => {
  try {
    await tipoServicoService.desativar(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ erro: (err as Error).message });
  }
});

router.put("/:id/reativar", autorizar("administrador"), async (req: Request, res: Response) => {
  try {
    await tipoServicoService.reativar(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ erro: (err as Error).message });
  }
});

export default router;
