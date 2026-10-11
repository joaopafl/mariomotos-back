import { HorarioDisponivel } from "../models/HorarioDisponivel";
import { Agendamento } from "../models/Agendamento";

const REGEX_DATA = /^\d{4}-\d{2}-\d{2}$/;
const REGEX_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const MAX_HORARIOS_POR_PEDIDO = 5000;

function paraMinutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

function paraHora(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Datas entre inicio e fim (inclusive), calculadas em UTC para nao sofrer com fuso
function datasEntre(inicio: string, fim: string): string[] {
  const resultado: string[] = [];
  const atual = new Date(`${inicio}T00:00:00Z`);
  const limite = new Date(`${fim}T00:00:00Z`);
  while (atual <= limite) {
    resultado.push(atual.toISOString().slice(0, 10));
    atual.setUTCDate(atual.getUTCDate() + 1);
  }
  return resultado;
}

export const horarioService = {
  /** Libera horarios em lote. diasSemana: 0 = domingo ... 6 = sabado. */
  async gerar(dados: {
    inicio: string;
    fim: string;
    diasSemana: number[];
    horaInicio: string;
    horaFim: string;
    intervaloMin: number;
  }): Promise<{ criados: number }> {
    const { inicio, fim, diasSemana, horaInicio, horaFim, intervaloMin } = dados;

    if (!REGEX_DATA.test(inicio) || !REGEX_DATA.test(fim)) {
      throw new Error("Datas invalidas. Use o formato AAAA-MM-DD.");
    }
    if (inicio > fim) {
      throw new Error("A data inicial deve ser anterior ou igual a final.");
    }
    if (!Array.isArray(diasSemana) || diasSemana.length === 0 || diasSemana.some((d) => !Number.isInteger(d) || d < 0 || d > 6)) {
      throw new Error("Escolha pelo menos um dia da semana.");
    }
    if (!REGEX_HORA.test(horaInicio) || !REGEX_HORA.test(horaFim)) {
      throw new Error("Horarios invalidos. Use o formato HH:MM.");
    }
    const ini = paraMinutos(horaInicio);
    const fimMin = paraMinutos(horaFim);
    if (ini >= fimMin) {
      throw new Error("O horario final deve ser depois do inicial.");
    }
    if (!Number.isInteger(intervaloMin) || intervaloMin < 15 || intervaloMin > 480) {
      throw new Error("Intervalo invalido.");
    }

    const horas: string[] = [];
    for (let m = ini; m < fimMin; m += intervaloMin) {
      horas.push(paraHora(m));
    }

    const datas = datasEntre(inicio, fim).filter((d) =>
      diasSemana.includes(new Date(`${d}T00:00:00Z`).getUTCDay())
    );

    if (datas.length * horas.length > MAX_HORARIOS_POR_PEDIDO) {
      throw new Error("Periodo muito grande. Libere em partes menores.");
    }

    const operacoes = [];
    for (const data of datas) {
      for (const horario of horas) {
        operacoes.push({
          updateOne: {
            filter: { data, horario },
            update: { $setOnInsert: { data, horario } },
            upsert: true,
          },
        });
      }
    }
    if (operacoes.length === 0) return { criados: 0 };

    const r = await HorarioDisponivel.bulkWrite(operacoes);
    return { criados: r.upsertedCount };
  },

  /** Horarios de um dia, com a marca de reservado. Se somenteLivres, devolve so os livres. */
  async listarPorDia(data: string, somenteLivres: boolean) {
    if (!REGEX_DATA.test(data)) {
      throw new Error("Data invalida. Use o formato AAAA-MM-DD.");
    }
    const slots = await HorarioDisponivel.find({ data }).sort({ horario: 1 }).lean();
    const agendamentos = await Agendamento.find({ data }).select("horario").lean();
    const reservados = new Set(agendamentos.map((a) => a.horario));

    const lista = slots.map((s) => ({
      _id: s._id,
      data: s.data,
      horario: s.horario,
      reservado: reservados.has(s.horario),
    }));
    return somenteLivres ? lista.filter((h) => !h.reservado) : lista;
  },

  async existe(data: string, horario: string): Promise<boolean> {
    const achou = await HorarioDisponivel.exists({ data, horario });
    return !!achou;
  },

  /** Remove um horario, desde que ninguem tenha reservado. */
  async remover(id: string): Promise<void> {
    const slot = await HorarioDisponivel.findById(id);
    if (!slot) throw new Error("Horario nao encontrado.");
    const reservado = await Agendamento.exists({ data: slot.data, horario: slot.horario });
    if (reservado) {
      throw new Error("Horario ja reservado. Cancele o agendamento antes de remover.");
    }
    await slot.deleteOne();
  },

  /** Remove todos os horarios livres de um dia (os reservados ficam). */
  async removerLivresDoDia(data: string): Promise<number> {
    const slots = await HorarioDisponivel.find({ data });
    const agendamentos = await Agendamento.find({ data }).select("horario").lean();
    const reservados = new Set(agendamentos.map((a) => a.horario));
    const ids = slots.filter((s) => !reservados.has(s.horario)).map((s) => s._id);
    if (ids.length === 0) return 0;
    const r = await HorarioDisponivel.deleteMany({ _id: { $in: ids } });
    return r.deletedCount ?? 0;
  },
};
