import mongoose, { Document, Schema, Types } from "mongoose";

export interface IMoto extends Document {
  clienteId: Types.ObjectId;
  placa: string;
  modelo: string;
  ano: number;
  ativa: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MotoSchema = new Schema<IMoto>(
  {
    clienteId: { type: Schema.Types.ObjectId, ref: "Cliente", required: true, index: true },
    placa: { type: String, required: true, uppercase: true, trim: true },
    modelo: { type: String, required: true, trim: true },
    ano: { type: Number, required: true },
    // true por padrao: motos ja existentes continuam ativas
    ativa: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Moto = mongoose.model<IMoto>("Moto", MotoSchema);
