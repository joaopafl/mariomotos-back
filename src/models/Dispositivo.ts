import mongoose, { Document, Schema, Types } from "mongoose";

export interface IDispositivo extends Document {
  clienteId: Types.ObjectId;
  token: string;
  plataforma: string;
  createdAt: Date;
  updatedAt: Date;
}

const DispositivoSchema = new Schema<IDispositivo>(
  {
    clienteId: { type: Schema.Types.ObjectId, ref: "Cliente", required: true, index: true },
    token: { type: String, required: true, unique: true },
    plataforma: { type: String, default: "android" },
  },
  { timestamps: true }
);

export const Dispositivo = mongoose.model<IDispositivo>("Dispositivo", DispositivoSchema);
