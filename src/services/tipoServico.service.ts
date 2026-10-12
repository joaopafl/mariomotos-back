import { TipoServico, ITipoServico } from "../models/TipoServico";

export const tipoServicoService = {
  async criar(dados: { nome: string; descricao?: string; valorPadrao?: number }): Promise<ITipoServico> {
    return TipoServico.create(dados);
  },

  async listarTodos(somenteAtivos = false): Promise<ITipoServico[]> {
    const filtro = somenteAtivos ? { ativo: { $ne: false } } : {};
    return TipoServico.find(filtro).sort({ nome: 1 });
  },

  async atualizar(id: string, dados: { nome?: string; descricao?: string; valorPadrao?: number }): Promise<void> {
    const permitido: any = {};
    if (dados.nome !== undefined) permitido.nome = dados.nome;
    if (dados.descricao !== undefined) permitido.descricao = dados.descricao;
    if (dados.valorPadrao !== undefined) permitido.valorPadrao = dados.valorPadrao;
    await TipoServico.findByIdAndUpdate(id, permitido, { runValidators: true });
  },

  // Nunca apaga: servicos ja realizados guardam o nome do catalogo.
  async desativar(id: string): Promise<void> {
    await TipoServico.findByIdAndUpdate(id, { ativo: false });
  },

  async reativar(id: string): Promise<void> {
    await TipoServico.findByIdAndUpdate(id, { ativo: true });
  },
};
