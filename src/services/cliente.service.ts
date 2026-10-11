import bcrypt from "bcrypt";
import crypto from "crypto";
import { Cliente, ICliente } from "../models/Cliente";
import { Moto } from "../models/Moto";
import { emailService } from "./email.service";
import { usuarioService } from "./usuario.service";
import { validarDadosMoto, DadosMoto } from "./moto.service";
import { cpfValido, somenteDigitos } from "../utils/validacao";

const SALT_ROUNDS = 10;
const CODIGO_VALIDADE_MIN = 15;
const MAX_TENTATIVAS = 5;

function gerarCodigo(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

export const clienteService = {
  // Criacao feita pelo admin/funcionario: ja nasce confirmada. CPF e opcional aqui,
  // mas, se vier, precisa ser valido e unico.
  async criar(dados: { nome: string; telefone: string; email: string; senha: string; cpf?: string }): Promise<ICliente> {
    const senhaHash = await bcrypt.hash(dados.senha, SALT_ROUNDS);
    const novo: any = {
      nome: dados.nome,
      telefone: dados.telefone,
      email: dados.email,
      senhaHash,
    };
    if (dados.cpf && String(dados.cpf).trim() !== "") {
      if (!cpfValido(dados.cpf)) throw new Error("CPF invalido.");
      const cpf = somenteDigitos(dados.cpf);
      if (await Cliente.exists({ cpf })) throw new Error("CPF ja cadastrado.");
      novo.cpf = cpf;
    }
    return Cliente.create(novo);
  },

  async listarTodos(): Promise<ICliente[]> {
    return Cliente.find().select("-senhaHash").sort({ nome: 1 });
  },

  async buscarPorId(id: string): Promise<ICliente | null> {
    return Cliente.findById(id).select("-senhaHash");
  },

  async buscarPorEmail(email: string): Promise<ICliente | null> {
    // Usado internamente pelo login - PRECISA retornar a senhaHash, por isso sem o .select("-senhaHash")
    return Cliente.findOne({ email: email.toLowerCase() });
  },

  async buscarPorNomeOuPlaca(termo: string): Promise<ICliente[]> {
    return Cliente.find({ nome: { $regex: termo, $options: "i" } }).select("-senhaHash");
  },

  async atualizar(id: string, dados: Partial<ICliente> & { senha?: string }): Promise<void> {
    const { senha, ...resto } = dados;
    delete (resto as any).senhaHash;
    delete (resto as any).emailConfirmado;
    delete (resto as any).codigoHash;
    const atualizacao: any = { ...resto };

    if (atualizacao.cpf !== undefined) {
      if (String(atualizacao.cpf).trim() === "") {
        delete atualizacao.cpf;
      } else {
        if (!cpfValido(atualizacao.cpf)) throw new Error("CPF invalido.");
        const cpf = somenteDigitos(atualizacao.cpf);
        const outro = await Cliente.findOne({ cpf, _id: { $ne: id } });
        if (outro) throw new Error("CPF ja cadastrado.");
        atualizacao.cpf = cpf;
      }
    }
    if (senha) {
      atualizacao.senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);
    }
    await Cliente.findByIdAndUpdate(id, atualizacao);
  },

  async deletar(id: string): Promise<void> {
    await Cliente.findByIdAndDelete(id);
  },

  /** "Esqueci minha senha": gera senha temporaria, grava o hash e envia por e-mail. */
  async recuperarSenha(email: string): Promise<void> {
    const cliente = await Cliente.findOne({ email: email.toLowerCase() });
    if (!cliente) return;

    const temporaria = crypto.randomBytes(5).toString("hex");
    cliente.senhaHash = await bcrypt.hash(temporaria, SALT_ROUNDS);
    await cliente.save();
    await emailService.enviarSenhaTemporaria(cliente.email, cliente.nome, temporaria);
  },

  /**
   * Auto-cadastro: exige CPF valido e uma moto. Cria a conta como nao confirmada
   * e envia o codigo por e-mail.
   */
  async cadastrar(dados: {
    nome: string;
    telefone: string;
    email: string;
    senha: string;
    cpf: string;
    moto: Partial<DadosMoto>;
  }): Promise<void> {
    const nome = (dados.nome || "").trim();
    const telefone = (dados.telefone || "").trim();
    const email = (dados.email || "").toLowerCase().trim();
    const senha = dados.senha || "";

    if (!nome || !telefone || !email || !senha) {
      throw new Error("Preencha nome, telefone, e-mail e senha.");
    }
    if (senha.length < 6) {
      throw new Error("A senha deve ter pelo menos 6 caracteres.");
    }
    if (!cpfValido(dados.cpf || "")) {
      throw new Error("CPF invalido.");
    }
    const cpf = somenteDigitos(dados.cpf);
    // Valida a moto ANTES de criar qualquer coisa, para nao deixar cadastro pela metade
    const moto = validarDadosMoto(dados.moto || {});

    if (await usuarioService.buscarPorEmail(email)) {
      throw new Error("E-mail ja cadastrado.");
    }

    const existente = await Cliente.findOne({ email });
    if (existente && existente.emailConfirmado !== false) {
      throw new Error("E-mail ja cadastrado.");
    }

    // CPF ja usado? Se o dono e um cadastro abandonado (nunca confirmou), libera o CPF.
    const donoDoCpf = await Cliente.findOne({ cpf });
    if (donoDoCpf && (!existente || String(donoDoCpf._id) !== String(existente._id))) {
      if (donoDoCpf.emailConfirmado === false) {
        await Moto.deleteMany({ clienteId: donoDoCpf._id });
        await donoDoCpf.deleteOne();
      } else {
        throw new Error("CPF ja cadastrado.");
      }
    }

    const codigo = gerarCodigo();
    const eraNovo = !existente;
    const cliente = existente ?? new Cliente({ email });
    cliente.nome = nome;
    cliente.telefone = telefone;
    cliente.cpf = cpf;
    cliente.senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);
    cliente.emailConfirmado = false;
    cliente.codigoHash = await bcrypt.hash(codigo, SALT_ROUNDS);
    cliente.codigoExpiraEm = new Date(Date.now() + CODIGO_VALIDADE_MIN * 60 * 1000);
    cliente.tentativasCodigo = 0;
    await cliente.save();

    try {
      // Se era um cadastro pendente anterior, a moto antiga e substituida pela nova
      await Moto.deleteMany({ clienteId: cliente._id });
      await Moto.create({ clienteId: cliente._id, ...moto });
    } catch (err) {
      if (eraNovo) await cliente.deleteOne();
      throw new Error("Nao foi possivel cadastrar a moto. Tente novamente.");
    }

    try {
      await emailService.enviarCodigoConfirmacao(cliente.email, cliente.nome, codigo);
    } catch (err) {
      console.error("Falha ao enviar codigo de confirmacao:", (err as Error).message);
      throw new Error("Nao foi possivel enviar o e-mail de confirmacao. Tente novamente.");
    }
  },

  /** Confere o codigo e ativa a conta. */
  async confirmarEmail(emailBruto: string, codigo: string): Promise<void> {
    const email = (emailBruto || "").toLowerCase().trim();
    const cliente = await Cliente.findOne({ email }).select("+codigoHash");

    if (!cliente || cliente.emailConfirmado !== false || !cliente.codigoHash) {
      throw new Error("Codigo invalido. Solicite um novo.");
    }
    if (!cliente.codigoExpiraEm || cliente.codigoExpiraEm < new Date()) {
      throw new Error("Codigo expirado. Solicite um novo.");
    }
    if (cliente.tentativasCodigo >= MAX_TENTATIVAS) {
      throw new Error("Muitas tentativas. Solicite um novo codigo.");
    }

    const confere = await bcrypt.compare(String(codigo || "").trim(), cliente.codigoHash);
    if (!confere) {
      cliente.tentativasCodigo += 1;
      await cliente.save();
      throw new Error("Codigo incorreto.");
    }

    cliente.emailConfirmado = true;
    cliente.codigoHash = undefined;
    cliente.codigoExpiraEm = undefined;
    cliente.tentativasCodigo = 0;
    await cliente.save();
  },

  /** Gera e envia um novo codigo para uma conta ainda nao confirmada. */
  async reenviarCodigo(emailBruto: string): Promise<void> {
    const email = (emailBruto || "").toLowerCase().trim();
    const cliente = await Cliente.findOne({ email });
    if (!cliente || cliente.emailConfirmado !== false) return;

    const codigo = gerarCodigo();
    cliente.codigoHash = await bcrypt.hash(codigo, SALT_ROUNDS);
    cliente.codigoExpiraEm = new Date(Date.now() + CODIGO_VALIDADE_MIN * 60 * 1000);
    cliente.tentativasCodigo = 0;
    await cliente.save();
    await emailService.enviarCodigoConfirmacao(cliente.email, cliente.nome, codigo);
  },
};
