import mongoose, { Document, Schema } from "mongoose";

export interface ITipoServico extends Document {
  nome: string;
  descricao: string;
  valorPadrao: number;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TipoServicoSchema = new Schema<ITipoServico>(
  {
    nome: { type: String, required: true, unique: true, trim: true },
    descricao: { type: String, default: "", trim: true },
    valorPadrao: { type: Number, default: 0, min: 0 },
    ativo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const TipoServico = mongoose.model<ITipoServico>("TipoServico", TipoServicoSchema);
