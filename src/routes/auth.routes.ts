import { Router, Request, Response } from "express";
import { authService } from "../services/auth.service";
import { clienteService } from "../services/cliente.service";

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

// Auto-cadastro de cliente: cria a conta nao confirmada e envia o codigo por e-mail
router.post("/cadastro", async (req: Request, res: Response) => {
  try {
    await clienteService.cadastrar(req.body);
    res.status(201).json({ mensagem: "Enviamos um codigo de confirmacao para o seu e-mail." });
  } catch (err) {
    res.status(400).json({ erro: (err as Error).message });
  }
});

router.post("/confirmar-email", async (req: Request, res: Response) => {
  try {
    const { email, codigo } = req.body;
    if (!email || !codigo) {
      return res.status(400).json({ erro: "Informe e-mail e codigo." });
    }
    await clienteService.confirmarEmail(email, codigo);
    res.json({ mensagem: "E-mail confirmado." });
  } catch (err) {
    res.status(400).json({ erro: (err as Error).message });
  }
});

router.post("/reenviar-codigo", async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ erro: "Informe o e-mail." });
  }
  try {
    await clienteService.reenviarCodigo(email);
  } catch (err) {
    console.error("Falha ao reenviar codigo:", (err as Error).message);
  }
  res.json({ mensagem: "Se a conta existir e estiver pendente, enviamos um novo codigo." });
});

// Cliente esqueceu a senha: envia uma senha temporaria por e-mail.
// A resposta e sempre a mesma, exista ou nao o e-mail.
router.post("/esqueci-senha", async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ erro: "Informe o e-mail." });
  }
  try {
    await clienteService.recuperarSenha(email);
  } catch (err) {
    console.error("Falha ao enviar e-mail de recuperacao:", (err as Error).message);
  }
  res.json({ mensagem: "Se o e-mail estiver cadastrado, enviamos uma senha temporaria." });
});

export default router;
