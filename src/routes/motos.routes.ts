import { Router, Request, Response } from "express";
import { motoService } from "../services/moto.service";
import { autenticar, autorizar } from "../middlewares/autenticar.middleware";

const router = Router();

router.use(autenticar);

/**
 * Cliente so mexe nas proprias motos. Devolve true se pode; senao ja responde 403/404.
 * A equipe (funcionario/administrador) pode tudo.
 */
async function podeMexerNaMoto(req: Request, res: Response, motoId: string): Promise<boolean> {
  const usuario = req.usuarioAutenticado;
  if (usuario?.perfil !== "cliente") return true;
  const moto = await motoService.buscarPorId(motoId);
  if (!moto) {
    res.status(404).json({ erro: "Moto nao encontrada" });
    return false;
  }
  if (String(moto.clienteId) !== usuario.id) {
    res.status(403).json({ erro: "Voce so pode alterar as suas motos." });
    return false;
  }
  return true;
}

// Admin: listar todas as motos, independente do cliente
router.get("/", autorizar("administrador"), async (_req: Request, res: Response) => {
  try {
    res.json(await motoService.listarTodas());
  } catch (err) {
    res.status(500).json({ erro: (err as Error).message });
  }
});

// RF04 - Cadastrar moto vinculada a um cliente.
// Se quem cadastra e o proprio cliente, a moto e sempre dele.
router.post("/", async (req: Request, res: Response) => {
  try {
    const dados = { ...req.body };
    if (req.usuarioAutenticado?.perfil === "cliente") {
      dados.clienteId = req.usuarioAutenticado.id;
    }
    const moto = await motoService.criar(dados);
    res.status(201).json(moto);
  } catch (err) {
    res.status(400).json({ erro: (err as Error).message });
  }
});

// RF15 - Listar motos de um cliente (suporte a multiplas motos)
router.get("/cliente/:clienteId", async (req: Request, res: Response) => {
  try {
    const usuario = req.usuarioAutenticado;
    if (usuario?.perfil === "cliente" && usuario.id !== req.params.clienteId) {
      return res.status(403).json({ erro: "Voce so pode ver as suas motos." });
    }
    const motos = await motoService.listarPorCliente(req.params.clienteId);
    res.json(motos);
  } catch (err) {
    res.status(500).json({ erro: (err as Error).message });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    if (!(await podeMexerNaMoto(req, res, req.params.id))) return;
    const moto = await motoService.buscarPorId(req.params.id);
    if (!moto) return res.status(404).json({ erro: "Moto nao encontrada" });
    res.json(moto);
  } catch (err) {
    res.status(500).json({ erro: (err as Error).message });
  }
});

// Editar placa, modelo ou ano (o dono e o status nao mudam por aqui)
router.put("/:id", async (req: Request, res: Response) => {
  try {
    if (!(await podeMexerNaMoto(req, res, req.params.id))) return;
    const { placa, modelo, ano } = req.body;
    await motoService.atualizar(req.params.id, { placa, modelo, ano });
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ erro: (err as Error).message });
  }
});

// Desativar: o cliente precisa continuar com pelo menos uma moto ativa
router.put("/:id/desativar", async (req: Request, res: Response) => {
  try {
    if (!(await podeMexerNaMoto(req, res, req.params.id))) return;
    await motoService.desativar(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(409).json({ erro: (err as Error).message });
  }
});

router.put("/:id/reativar", async (req: Request, res: Response) => {
  try {
    if (!(await podeMexerNaMoto(req, res, req.params.id))) return;
    await motoService.reativar(req.params.id);
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
    res.status(409).json({ erro: (err as Error).message });
  }
});

export default router;
