import { Router, Request, Response } from "express";
import { autenticar, autorizar } from "../middlewares/autenticar.middleware";
import { Dispositivo } from "../models/Dispositivo";

const router = Router();

router.use(autenticar);

// O app do cliente registra o token do aparelho para receber notificacoes.
// Se o token ja existia (ex: outro cliente usou o mesmo aparelho), ele passa a ser deste cliente.
router.post("/", autorizar("cliente"), async (req: Request, res: Response) => {
  try {
    const token = String(req.body?.token ?? "").trim();
    if (!token) return res.status(400).json({ erro: "Informe o token do aparelho." });
    await Dispositivo.findOneAndUpdate(
      { token },
      { clienteId: req.usuarioAutenticado!.id, plataforma: "android" },
      { upsert: true }
    );
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ erro: (err as Error).message });
  }
});

// Ao sair da conta, o app remove o aparelho para nao receber avisos de outra pessoa.
router.delete("/", autorizar("cliente"), async (req: Request, res: Response) => {
  try {
    const token = String(req.body?.token ?? "").trim();
    if (token) await Dispositivo.deleteOne({ token, clienteId: req.usuarioAutenticado!.id });
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ erro: (err as Error).message });
  }
});

export default router;
