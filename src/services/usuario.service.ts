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

  async desativar(id: string): Promise<void> {
    // "Remover" funcionario = desativar conta, nao apagar historico de quem registrou o que.
    await Usuario.findByIdAndUpdate(id, { ativo: false });
  },

  async reativar(id: string): Promise<void> {
    await Usuario.findByIdAndUpdate(id, { ativo: true });
  },
};
