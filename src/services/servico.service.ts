import { Servico, IServico } from "../models/Servico";
import { Moto } from "../models/Moto";

export const servicoService = {
  async criar(dados: Partial<IServico>): Promise<IServico> {
    // RN06: servico so pode ser criado vinculado a uma moto existente
    const moto = await Moto.findById(dados.motoId);
    if (!moto) {
      throw new Error("Moto nao encontrada. Nao e possivel registrar servico.");
    }
    return Servico.create(dados);
  },

  async listarTodos(): Promise<IServico[]> {
    return Servico.find().sort({ data: -1 });
  },

  async listarPorMoto(motoId: string): Promise<IServico[]> {
    return Servico.find({ motoId }).sort({ data: -1 });
  },

  async buscarPorId(id: string): Promise<IServico | null> {
    return Servico.findById(id);
  },

  async atualizar(id: string, dados: Partial<IServico>): Promise<void> {
    await Servico.findByIdAndUpdate(id, dados);
  },

  async deletar(id: string): Promise<void> {
    await Servico.findByIdAndDelete(id);
  },
};