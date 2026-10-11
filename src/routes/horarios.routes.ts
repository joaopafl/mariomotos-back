import { Router, Request, Response } from "express";
import { horarioService } from "../services/horario.service";
import { autenticar, autorizar } from "../middlewares/autenticar.middleware";

const router = Router();

router.use(autenticar);

// Horarios de um dia. Cliente so enxerga os livres; equipe ve todos com a marca "reservado".
router.get("/dia/:data", async (req: Request, res: Response) => {
  try {
    const ehCliente = req.usuarioAutenticado?.perfil === "cliente";
    res.json(await horarioService.listarPorDia(req.params.data, ehCliente));
  } catch (err) {
    res.status(400).json({ erro: (err as Error).message });
  }
});

// Daqui para baixo, somente administrador
router.post("/gerar", autorizar("administrador"), async (req: Request, res: Response) => {
  try {
    res.status(201).json(await horarioService.gerar(req.body));
  } catch (err) {
    res.status(400).json({ erro: (err as Error).message });
  }
});

router.delete("/dia/:data", autorizar("administrador"), async (req: Request, res: Response) => {
  try {
    const removidos = await horarioService.removerLivresDoDia(req.params.data);
    res.json({ removidos });
  } catch (err) {
    res.status(400).json({ erro: (err as Error).message });
  }
});

router.delete("/:id", autorizar("administrador"), async (req: Request, res: Response) => {
  try {
    await horarioService.remover(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(409).json({ erro: (err as Error).message });
  }
});

export default router;
