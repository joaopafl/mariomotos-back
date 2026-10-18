import bcrypt from "bcrypt";
import { Usuario, IUsuario } from "../models/Usuario";
import { cpfValido, somenteDigitos } from "../utils/validacao";

const SALT_ROUNDS = 10;

export const usuarioService = {
  /** Valida o CPF e confere se ainda nao esta em uso por outro usuario. */
  async validarCpf(cpfBruto: string, ignorarId?: string): Promise<string> {
    if (!cpfValido(cpfBruto || "")) throw new Error("CPF invalido.");
    const cpf = somenteDigitos(cpfBruto);
    const filtro: any = { cpf };
    if (ignorarId) filtro._id = { $ne: ignorarId };
    if (await Usuario.exists(filtro)) throw new Error("CPF ja cadastrado.");
    return cpf;
  },

  async criar(dados: {
    nome: string;
    email: string;
    senha: string;
    perfil: "funcionario" | "administrador";
    cpf?: string;
    titulo?: string;
  }): Promise<IUsuario> {
    const senhaHash = await bcrypt.hash(dados.senha, SALT_ROUNDS);
    const novo: any = {
      nome: dados.nome,
      email: dados.email,
      perfil: dados.perfil,
      senhaHash,
    };
    if (dados.cpf) novo.cpf = await this.validarCpf(dados.cpf);
    if (dados.titulo) novo.titulo = dados.titulo.trim();
    return Usuario.create(novo);
  },

  async listarTodos(): Promise<IUsuario[]> {
    return Usuario.find().select("-senhaHash").sort({ nome: 1 });
  },

  async buscarPorId(id: string): Promise<IUsuario | null> {
    return Usuario.findById(id).select("-senhaHash");
  },

  async buscarPorEmail(email: string): Promise<IUsuario | null> {
    // Usado internamente pelo login - PRECISA retornar a senhaHash, por isso sem o .select("-senhaHash")
    return Usuario.findOne({ email: email.toLowerCase() });
  },

  async atualizar(
    id: string,
    dados: { nome?: string; email?: string; perfil?: "funcionario" | "administrador"; cpf?: string; titulo?: string }
  ): Promise<void> {
    const permitido: any = {};
    if (dados.cpf) permitido.cpf = await this.validarCpf(dados.cpf, id);
    if (dados.titulo !== undefined) permitido.titulo = String(dados.titulo).trim();
    if (dados.nome) permitido.nome = dados.nome;
    if (dados.email) permitido.email = dados.email.toLowerCase();
    if (dados.perfil) permitido.perfil = dados.perfil;
    await Usuario.findByIdAndUpdate(id, permitido);
  },

  async redefinirSenha(id: string, novaSenha: string): Promise<void> {
    if (!novaSenha || novaSenha.length < 6) {
      throw new Error("A senha deve ter pelo menos 6 caracteres.");
    }
    const senhaHash = await bcrypt.hash(novaSenha, SALT_ROUNDS);
    await Usuario.findByIdAndUpdate(id, { senhaHash });
  },

  async desativar(id: string): Promise<void> {
    // "Remover" funcionario = desativar conta, nao apagar historico de quem registrou o que.
    await Usuario.findByIdAndUpdate(id, { ativo: false });
  },

  async reativar(id: string): Promise<void> {
    await Usuario.findByIdAndUpdate(id, { ativo: true });
  },
};
