import bcrypt from "bcrypt";
import { Cliente, ICliente } from "../models/Cliente";

const SALT_ROUNDS = 10;

export const clienteService = {
  async criar(dados: { nome: string; telefone: string; email: string; senha: string }): Promise<ICliente> {
    const senhaHash = await bcrypt.hash(dados.senha, SALT_ROUNDS);
    return Cliente.create({
      nome: dados.nome,
      telefone: dados.telefone,
      email: dados.email,
      senhaHash,
    });
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

  async atualizar(id: string, dados: Partial<ICliente>): Promise<void> {
    await Cliente.findByIdAndUpdate(id, dados);
  },

  async deletar(id: string): Promise<void> {
    await Cliente.findByIdAndDelete(id);
  },
};
