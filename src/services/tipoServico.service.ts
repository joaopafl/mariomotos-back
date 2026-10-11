import { TipoServico, ITipoServico } from "../models/TipoServico";

export const tipoServicoService = {
  async criar(dados: { nome: string; descricao?: string; valorPadrao?: number }): Promise<ITipoServico> {
    return TipoServico.create(dados);
  },

  async listarTodos(): Promise<ITipoServico[]> {
    return TipoServico.find().sort({ nome: 1 });
  },

  async atualizar(id: string, dados: { nome?: string; descricao?: string; valorPadrao?: number }): Promise<void> {
    const permitido: any = {};
    if (dados.nome !== undefined) permitido.nome = dados.nome;
    if (dados.descricao !== undefined) permitido.descricao = dados.descricao;
    if (dados.valorPadrao !== undefined) permitido.valorPadrao = dados.valorPadrao;
    await TipoServico.findByIdAndUpdate(id, permitido, { runValidators: true });
  },

  async deletar(id: string): Promise<void> {
    await TipoServico.findByIdAndDelete(id);
  },
};
