import mongoose, { Document, Schema } from "mongoose";

export interface ICliente extends Document {
  nome: string;
  telefone: string;
  email: string;
  senhaHash: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClienteSchema = new Schema<ICliente>(
  {
    nome: { type: String, required: true, trim: true },
    telefone: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    senhaHash: { type: String, required: true },
  },
  { timestamps: true }
);

export const Cliente = mongoose.model<ICliente>("Cliente", ClienteSchema);
