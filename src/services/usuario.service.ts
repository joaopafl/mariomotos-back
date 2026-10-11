import bcrypt from "bcrypt";
import { Usuario, IUsuario } from "../models/Usuario";

const SALT_ROUNDS = 10;

export const usuarioService = {
  async criar(dados: { nome: string; email: string; senha: string; perfil: "funcionario" | "administrador" }): Promise<IUsuario> {
    const senhaHash = await bcrypt.hash(dados.senha, SALT_ROUNDS);
    return Usuario.create({
      nome: dados.nome,
      email: dados.email,
      perfil: dados.perfil,
      senhaHash,
    });
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

  async atualizar(id: string, dados: { nome?: string; email?: string; perfil?: "funcionario" | "administrador" }): Promise<void> {
    const permitido: any = {};
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
