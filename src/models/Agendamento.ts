import mongoose, { Document, Schema, Types } from "mongoose";

export interface IAgendamento extends Document {
  clienteId: Types.ObjectId;
  motoId: Types.ObjectId;
  data: string;
  horario: string;
  tipoServicoPrevisto: string;
  observacoes?: string;
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
  },
  { timestamps: true }
);

export const Agendamento = mongoose.model<IAgendamento>("Agendamento", AgendamentoSchema);
