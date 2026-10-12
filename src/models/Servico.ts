import mongoose, { Document, Schema, Types } from "mongoose";

export interface IServico extends Document {
  motoId: Types.ObjectId;
  tipoServico: string;
  data: string;
  valor: number;
  quilometragem?: number;
  observacoes?: string;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ServicoSchema = new Schema<IServico>(
  {
    motoId: { type: Schema.Types.ObjectId, ref: "Moto", required: true, index: true },
    tipoServico: { type: String, required: true, trim: true },
    data: { type: String, required: true },
    valor: { type: Number, required: true },
    quilometragem: { type: Number },
    observacoes: { type: String, default: "" },
    ativo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Servico = mongoose.model<IServico>("Servico", ServicoSchema);
