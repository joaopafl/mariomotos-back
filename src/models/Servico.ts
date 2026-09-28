//importa tres ferramentas da biblioteca mongoose necessarias parao projeto
import mongoose, { Document, Schema, Types } from "mongoose";

// Define o formato (campos e tipos) que um objeto Serviço deve ter, validado pelo TypeScript ao compilar
export interface IServico extends Document {
  motoId: Types.ObjectId;
  tipoServico: string;
  data: string;
  valor: number;
  quilometragem?: number;
  observacoes?: string;
  createdAt: Date;
  updatedAt: Date;
}
// Define e valida, em tempo de execução, a estrutura dos dados de Serviço que serão salvos no MongoDB
const ServicoSchema = new Schema<IServico>(
  {
    motoId: { type: Schema.Types.ObjectId, ref: "Moto", required: true, index: true },
    tipoServico: { type: String, required: true, trim: true },
    data: { type: String, required: true },
    valor: { type: Number, required: true },
    quilometragem: { type: Number },
    observacoes: { type: String, default: "" },
  },
  { timestamps: true }
);
// Cria a Model "Servico" a partir do Schema e da interface, e salva dados na coleção serviço no mongoDb
export const Servico = mongoose.model<IServico>("Servico", ServicoSchema);
