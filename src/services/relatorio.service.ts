import { Servico } from "../models/Servico";
import { Agendamento } from "../models/Agendamento";

export const relatorioService = {
  async faturamentoPorPeriodo(inicio: string, fim: string) {
    const servicos = await Servico.find({ data: { $gte: inicio, $lte: fim } });
    const total = servicos.reduce((soma, s) => soma + s.valor, 0);
    return {
      periodo: { inicio, fim },
      quantidadeServicos: servicos.length,
      faturamentoTotal: total,
    };
  },

  async servicosPorPeriodo(inicio: string, fim: string) {
    const servicos = await Servico.find({ data: { $gte: inicio, $lte: fim } }).sort({ data: 1 });
    return servicos;
  },

  async agendamentosPorPeriodo(inicio: string, fim: string) {
    const agendamentos = await Agendamento.find({ data: { $gte: inicio, $lte: fim } }).sort({ data: 1 });
    return agendamentos;
  },
};
