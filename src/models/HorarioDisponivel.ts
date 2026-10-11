import mongoose, { Document, Schema } from "mongoose";

export interface IHorarioDisponivel extends Document {
  data: string; // YYYY-MM-DD
  horario: string; // HH:MM
  createdAt: Date;
  updatedAt: Date;
}

const HorarioDisponivelSchema = new Schema<IHorarioDisponivel>(
  {
    data: { type: String, required: true, index: true },
    horario: { type: String, required: true },
  },
  { timestamps: true }
);

// Nao existem dois horarios iguais no mesmo dia
HorarioDisponivelSchema.index({ data: 1, horario: 1 }, { unique: true });

export const HorarioDisponivel = mongoose.model<IHorarioDisponivel>(
  "HorarioDisponivel",
  HorarioDisponivelSchema
);
