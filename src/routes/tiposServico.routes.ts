import { Router, Request, Response } from "express";
import { tipoServicoService } from "../services/tipoServico.service";
import { autenticar, autorizar } from "../middlewares/autenticar.middleware";

const router = Router();

router.use(autenticar);

// Qualquer usuario logado (cliente, funcionario, admin) consulta o catalogo
router.get("/", async (_req: Request, res: Response) => {
  try {
    res.json(await tipoServicoService.listarTodos());
  } catch (err) {
    res.status(500).json({ erro: (err as Error).message });
  }
});

// Somente administrador cadastra, edita e exclui
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

router.delete("/:id", autorizar("administrador"), async (req: Request, res: Response) => {
  try {
    await tipoServicoService.deletar(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ erro: (err as Error).message });
  }
});

export default router;
