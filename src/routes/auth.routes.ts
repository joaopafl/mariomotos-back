import { Router, Request, Response } from "express";
import { authService } from "../services/auth.service";

const router = Router();

// RF01/RF02 - login unico, identifica o perfil automaticamente
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) {
      return res.status(400).json({ erro: "Informe e-mail e senha." });
    }
    const resultado = await authService.login(email, senha);
    res.json(resultado);
  } catch (err) {
    res.status(401).json({ erro: (err as Error).message });
  }
});

export default router;
