import { Servico } from "../models/Servico";
import { Agendamento } from "../models/Agendamento";
import { jaPassou } from "../utils/tempo";

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const DIA_MS = 24 * 60 * 60 * 1000;

const meioDia = (iso: string) => Date.parse(`${iso}T12:00:00Z`);

function somarDias(iso: string, n: number): string {
  return new Date(meioDia(iso) + n * DIA_MS).toISOString().slice(0, 10);
}

function diasEntre(inicio: string, fim: string): number {
  return Math.round((meioDia(fim) - meioDia(inicio)) / DIA_MS) + 1;
}

const soma = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const media = (xs: number[]) => (xs.length ? soma(xs) / xs.length : 0);

export const relatorioResumoService = {
  /** Indicadores agregados do periodo (para a tela de relatorios): nada de listas brutas. */
  async resumo(inicio: string, fim: string) {
    if (!ISO.test(inicio ?? "") || !ISO.test(fim ?? "")) throw new Error("Informe inicio e fim (AAAA-MM-DD).");
    if (inicio > fim) throw new Error("A data inicial nao pode ser maior que a final.");
    const dias = diasEntre(inicio, fim);
    if (dias > 366 * 5) throw new Error("Periodo maximo de 5 anos.");

    // Periodo anterior com a mesma duracao, para comparar
    const antFim = somarDias(inicio, -1);
    const antInicio = somarDias(inicio, -dias);

    const [servicos, servicosAnt, agendamentos] = await Promise.all([
      Servico.find({ data: { $gte: inicio, $lte: fim } }).lean(),
      Servico.find({ data: { $gte: antInicio, $lte: antFim } }).select("valor").lean(),
      Agendamento.find({ data: { $gte: inicio, $lte: fim } }).lean(),
    ]);

    const faturamento = soma(servicos.map((s) => s.valor ?? 0));
    const faturamentoAnterior = soma(servicosAnt.map((s) => s.valor ?? 0));

    // Serie de faturamento: por dia (ate 31 dias) ou por mes
    const porDia = dias <= 31;
    const chave = (data: string) => (porDia ? data : data.slice(0, 7));
    const mapa = new Map<string, { valor: number; quantidade: number }>();
    if (porDia) {
      for (let i = 0; i < dias; i++) mapa.set(somarDias(inicio, i), { valor: 0, quantidade: 0 });
    } else {
      let [a, m] = inicio.slice(0, 7).split("-").map(Number);
      const ultimo = fim.slice(0, 7);
      for (;;) {
        const k = `${a}-${String(m).padStart(2, "0")}`;
        mapa.set(k, { valor: 0, quantidade: 0 });
        if (k >= ultimo) break;
        m++;
        if (m > 12) {
          m = 1;
          a++;
        }
      }
    }
    for (const s of servicos) {
      const p = mapa.get(chave(s.data));
      if (p) {
        p.valor += s.valor ?? 0;
        p.quantidade += 1;
      }
    }
    const serie = [...mapa.entries()].map(([k, v]) => ({ chave: k, ...v }));

    // Servicos mais realizados
    const porTipo = new Map<string, { quantidade: number; faturamento: number }>();
    for (const s of servicos) {
      const t = porTipo.get(s.tipoServico) ?? { quantidade: 0, faturamento: 0 };
      t.quantidade += 1;
      t.faturamento += s.valor ?? 0;
      porTipo.set(s.tipoServico, t);
    }
    const topServicos = [...porTipo.entries()]
      .map(([tipo, v]) => ({ tipo, ...v }))
      .sort((x, y) => y.faturamento - x.faturamento || y.quantidade - x.quantidade);

    // Agendamentos por situacao
    let finalizados = 0;
    let emAtendimento = 0;
    let agendados = 0;
    let naoRealizados = 0;
    const diaSemana = [0, 0, 0, 0, 0, 0, 0]; // domingo..sabado
    const tempos: number[] = [];
    const porMecanico = new Map<string, { atendimentos: number; faturamento: number; tempos: number[] }>();
    for (const a of agendamentos) {
      diaSemana[new Date(meioDia(a.data)).getUTCDay()] += 1;
      if (a.finalizadoEm) {
        finalizados++;
        if (a.duracaoFinalSeg) tempos.push(a.duracaoFinalSeg);
        const nome = a.atendenteNome || "Sem identificacao";
        const m = porMecanico.get(nome) ?? { atendimentos: 0, faturamento: 0, tempos: [] };
        m.atendimentos += 1;
        m.faturamento += a.valorFinal ?? 0;
        if (a.duracaoFinalSeg) m.tempos.push(a.duracaoFinalSeg);
        porMecanico.set(nome, m);
      } else if (a.iniciadoEm) {
        emAtendimento++;
      } else if (jaPassou(a.data, a.horario)) {
        naoRealizados++;
      } else {
        agendados++;
      }
    }
    const jaOcorridos = finalizados + emAtendimento + naoRealizados;

    const mecanicos = [...porMecanico.entries()]
      .map(([nome, m]) => ({
        nome,
        atendimentos: m.atendimentos,
        faturamento: m.faturamento,
        tempoMedioSeg: Math.round(media(m.tempos)),
      }))
      .sort((x, y) => y.atendimentos - x.atendimentos);

    return {
      periodo: { inicio, fim, dias },
      agregacao: porDia ? "dia" : "mes",
      faturamento,
      faturamentoAnterior,
      quantidadeServicos: servicos.length,
      quantidadeServicosAnterior: servicosAnt.length,
      ticketMedio: servicos.length ? faturamento / servicos.length : 0,
      motosAtendidas: new Set(servicos.map((s) => String(s.motoId))).size,
      tempoMedioSeg: Math.round(media(tempos)),
      serie,
      topServicos,
      agendamentos: {
        total: agendamentos.length,
        finalizados,
        emAtendimento,
        agendados,
        naoRealizados,
        taxaConclusao: jaOcorridos ? finalizados / jaOcorridos : null,
      },
      mecanicos,
      diaSemana,
    };
  },
};
