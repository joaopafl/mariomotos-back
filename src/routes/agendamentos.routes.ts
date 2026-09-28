//Express - Framework para nodejs que cria servidor web/api
// Importa do Express as ferramentas para criar rotas (Router) e os tipos de requisição e resposta (Request, Response)
import { Router, Request, Response } from "express";


// Importa o service de agendamentos, responsável pelas regras de negócio e acesso ao banco de dados
import { agendamentoService } from "../services/agendamento.service";


// Importa o middleware que verifica se o usuário está autenticado antes de acessar as rotas
import { autenticar } from "../middlewares/autenticar.middleware";

// Cria um roteador do Express para agrupar as rotas de agendamento
const router = Router();

// Aplica o middleware de autenticação a todas as rotas definidas abaixo neste arquivo
router.use(autenticar);

// Rota para criar um novo agendamento
router.post("/", async (req: Request, res: Response) => {
  try {
    const dados = { ...req.body };
    // Se quem está autenticado é um Cliente, força o clienteId a ser o dele mesmo, ignorando o que veio no corpo da requisição: Motivo - segurança
    if (req.usuarioAutenticado?.perfil === "cliente") {
      dados.clienteId = req.usuarioAutenticado.id;
    }
    const agendamento = await agendamentoService.criar(dados);
    res.status(201).json(agendamento);
  } catch (err) {
    res.status(409).json({ erro: (err as Error).message });
  }
});

// Rota que retorna todos os agendamentos de uma data específica informada na URL
router.get("/dia/:data", async (req: Request, res: Response) => {
  try {
    const agendamentos = await agendamentoService.listarPorDia(req.params.data);
    res.json(agendamentos);
  } catch (err) {
    res.status(500).json({ erro: (err as Error).message });
  }
});

// Rota que retorna todos os agendamentos de um cliente específico
router.get("/cliente/:clienteId", async (req: Request, res: Response) => {
  try {
    const agendamentos = await agendamentoService.listarPorCliente(req.params.clienteId);
    res.json(agendamentos);
  } catch (err) {
    res.status(500).json({ erro: (err as Error).message });
  }
});

// Rota que retorna um único agendamento pelo seu id, ou erro 404 se não existir
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const agendamento = await agendamentoService.buscarPorId(req.params.id);
    if (!agendamento) return res.status(404).json({ erro: "Agendamento nao encontrado" });
    res.json(agendamento);
  } catch (err) {
    res.status(500).json({ erro: (err as Error).message });
  }
});

// Rota que atualiza um agendamento existente, revalidando conflito de horário caso a data/hora tenha mudado
router.put("/:id", async (req: Request, res: Response) => {
  try {
    await agendamentoService.atualizar(req.params.id, req.body);
    res.status(204).send();
  } catch (err) {
    res.status(409).json({ erro: (err as Error).message });
  }
});

// TODO: escrever comentário aqui — a regra agora é: cliente só cancela o próprio agendamento, funcionário/administrador cancela qualquer um
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const agendamento = await agendamentoService.buscarPorId(req.params.id);
    if (!agendamento) return res.status(404).json({ erro: "Agendamento nao encontrado" });

    const ehDono = String(agendamento.clienteId) === req.usuarioAutenticado?.id;
    const ehStaff = req.usuarioAutenticado?.perfil !== "cliente";

    if (!ehDono && !ehStaff) {
      return res.status(403).json({ erro: "Voce so pode cancelar seus proprios agendamentos" });
    }

    await agendamentoService.cancelar(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ erro: (err as Error).message });
  }
});

export default router;