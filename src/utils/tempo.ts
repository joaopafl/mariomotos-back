/** Instante de um agendamento (Brasil sem horario de verao: UTC-3). */
export function instanteDoAgendamento(data: string, horario: string): Date {
  return new Date(`${data}T${horario}:00-03:00`);
}

/** Verdadeiro quando a data e o horario informados ja ficaram para tras. */
export function jaPassou(data?: string, horario?: string): boolean {
  if (!data || !horario) return false;
  const t = instanteDoAgendamento(data, horario).getTime();
  return Number.isFinite(t) && t < Date.now();
}
