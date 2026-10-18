import mongoose, { Document, Schema, Types } from "mongoose";

export interface IAgendamento extends Document {
  clienteId: Types.ObjectId;
  motoId: Types.ObjectId;
  data: string;
  horario: string;
  tipoServicoPrevisto: string;
  observacoes?: string;
  iniciadoEm?: Date;
  finalizadoEm?: Date;
  atendenteId?: Types.ObjectId;
  atendenteNome?: string;
  atendenteTitulo?: string;
  observacoesAtendimento?: string;
  lembreteEnviadoEm?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AgendamentoSchema = new Schema<IAgendamento>(
  {
    clienteId: { type: Schema.Types.ObjectId, ref: "Cliente", required: true, index: true },
    motoId: { type: Schema.Types.ObjectId, ref: "Moto", required: true },
    data: { type: String, required: true, index: true },
    horario: { type: String, required: true },
    tipoServicoPrevisto: { type: String, required: true, trim: true },
    observacoes: { type: String, default: "" },
    // Atendimento: sem iniciadoEm = nao iniciado; com iniciadoEm e sem finalizadoEm = em atendimento
    iniciadoEm: { type: Date },
    finalizadoEm: { type: Date },
    atendenteId: { type: Schema.Types.ObjectId, ref: "Usuario" },
    atendenteNome: { type: String, trim: true },
    atendenteTitulo: { type: String, trim: true },
    observacoesAtendimento: { type: String, trim: true },
    // Controle do lembrete enviado um dia antes
    lembreteEnviadoEm: { type: Date },
  },
  { timestamps: true }
);

export const Agendamento = mongoose.model<IAgendamento>("Agendamento", AgendamentoSchema);
