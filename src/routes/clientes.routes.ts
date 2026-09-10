import { Router, Request, Response } from "express";
import { clienteService } from "../services/cliente.service";

const router = Router();

// RF03 - Cadastrar cliente
router.post("/", async (req: Request, res: Response) => {
  try {
    const cliente = await clienteService.criar(req.body);
    res.status(201).json(cliente);
  } catch (err) {
    res.status(400).json({ erro: (err as Error).message });
  }
});

// RF06 - Listar/buscar clientes
router.get("/", async (req: Request, res: Response) => {
  try {
    const termo = req.query.busca as string | undefined;
    const clientes = termo
      ? await clienteService.buscarPorNomeOuPlaca(termo)
      : await clienteService.listarTodos();
    res.json(clientes);
  } catch (err) {
    res.status(500).json({ erro: (err as Error).message });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const cliente = await clienteService.buscarPorId(req.params.id);
    if (!cliente) return res.status(404).json({ erro: "Cliente nao encontrado" });
    res.json(cliente);
  } catch (err) {
    res.status(500).json({ erro: (err as Error).message });
  }
});

// RF05 - Editar cliente
router.put("/:id", async (req: Request, res: Response) => {
  try {
    await clienteService.atualizar(req.params.id, req.body);
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ erro: (err as Error).message });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    await clienteService.deletar(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ erro: (err as Error).message });
  }
});

export default router;
