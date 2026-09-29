import { Moto, IMoto } from "../models/Moto";

export const motoService = {
  async criar(dados: Partial<IMoto>): Promise<IMoto> {
    return Moto.create(dados);
  },

  async listarTodas(): Promise<IMoto[]> {
    return Moto.find();
  },

  async listarPorCliente(clienteId: string): Promise<IMoto[]> {
    return Moto.find({ clienteId });
  },

  async buscarPorId(id: string): Promise<IMoto | null> {
    return Moto.findById(id);
  },

  async atualizar(id: string, dados: Partial<IMoto>): Promise<void> {
    await Moto.findByIdAndUpdate(id, dados);
  },

  async deletar(id: string): Promise<void> {
    await Moto.findByIdAndDelete(id);
  },
};