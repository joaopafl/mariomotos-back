import { Servico, IServico } from "../models/Servico";
import { Moto } from "../models/Moto";

export const servicoService = {
  async criar(dados: Partial<IServico>): Promise<IServico> {
    // RN06: servico so pode ser criado vinculado a uma moto existente
    const moto = await Moto.findById(dados.motoId);
    if (!moto) {
      throw new Error("Moto nao encontrada. Nao e possivel registrar servico.");
    }
    delete (dados as any).ativo;
    return Servico.create(dados);
  },

  async listarPorMoto(motoId: string): Promise<IServico[]> {
    return Servico.find({ motoId }).sort({ data: -1, createdAt: -1 });
  },

  /** Admin: todos os servicos, com placa/modelo da moto para facilitar a busca no app. */
  async listarTodos(): Promise<any[]> {
    const servicos = await Servico.find().sort({ data: -1 }).lean();
    const ids = [...new Set(servicos.map((s) => String(s.motoId)))];
    const motos = await Moto.find({ _id: { $in: ids } }).select("placa modelo").lean();
    const porId = new Map(motos.map((m) => [String(m._id), m]));
    return servicos.map((s) => {
      const m = porId.get(String(s.motoId));
      return { ...s, motoPlaca: m?.placa ?? "", motoModelo: m?.modelo ?? "" };
    });
  },

  async buscarPorId(id: string): Promise<IServico | null> {
    return Servico.findById(id);
  },

  async atualizar(id: string, dados: Partial<IServico>): Promise<void> {
    delete (dados as any).ativo;
    delete (dados as any).motoId;
    await Servico.findByIdAndUpdate(id, dados);
  },

  // Servicos nunca sao apagados: relatorios e rastreamento dependem deles.
  async desativar(id: string): Promise<void> {
    await Servico.findByIdAndUpdate(id, { ativo: false });
  },

  async reativar(id: string): Promise<void> {
    await Servico.findByIdAndUpdate(id, { ativo: true });
  },
};
