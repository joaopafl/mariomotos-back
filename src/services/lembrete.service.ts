import { Agendamento } from "../models/Agendamento";
import { notificacaoService } from "./notificacao.service";

const FUSO = "America/Sao_Paulo";
const HORA_DO_ENVIO = 9;
const INTERVALO_MS = 15 * 60 * 1000;

function dataEHoraNoFuso(d: Date): { data: string; hora: number } {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const v: Record<string, string> = {};
  for (const p of partes) v[p.type] = p.value;
  return { data: `${v.year}-${v.month}-${v.day}`, hora: Number(v.hour) };
}

function dataBr(iso: string): string {
  return `${iso.substring(8, 10)}/${iso.substring(5, 7)}/${iso.substring(0, 4)}`;
}

export async function enviarLembretes(): Promise<void> {
  const agora = dataEHoraNoFuso(new Date());
  if (agora.hora < HORA_DO_ENVIO) return;

  const amanha = dataEHoraNoFuso(new Date(Date.now() + 24 * 60 * 60 * 1000)).data;
  const pendentes = await Agendamento.find({ data: amanha, lembreteEnviadoEm: { $exists: false } });

  for (const ag of pendentes) {
    // Marca antes de enviar, para nao repetir o aviso se o envio demorar
    const marcado = await Agendamento.findOneAndUpdate(
      { _id: ag._id, lembreteEnviadoEm: { $exists: false } },
      { lembreteEnviadoEm: new Date() }
    );
    if (!marcado) continue;

    await notificacaoService.avisarCliente(String(ag.clienteId), {
      titulo: "Lembrete de agendamento",
      corpo: `Amanhã, ${dataBr(ag.data)} às ${ag.horario}: ${ag.tipoServicoPrevisto}. Esperamos você na MarioMotos!`,
      dados: { tipo: "lembrete", agendamentoId: String(ag._id) },
    });
  }
}

export function iniciarLembretes(): void {
  const rodar = () => enviarLembretes().catch((err) => console.error("Falha nos lembretes:", err));
  setTimeout(rodar, 30 * 1000);
  setInterval(rodar, INTERVALO_MS);
}
