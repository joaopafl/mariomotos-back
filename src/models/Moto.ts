//importa tres ferramentas da biblioteca mongoose:  Mongoose o pacote principal, schema para definir quais campos o cliente possui e Document para definir que o mesmo é um doc do mongodb idenificado atraves do seu id
import mongoose, { Document, Schema, Types } from "mongoose";

// Define o formato (campos e tipos) que um objeto Moto deve ter, validado pelo TypeScript ao compilar
export interface IMoto extends Document {
  clienteId: Types.ObjectId;
  placa: string;
  modelo: string;
  ano: number;
  createdAt: Date;
  updatedAt: Date;
}
// Define e valida, em tempo de execução, a estrutura dos dados de Moto que serão salvos no MongoDB, incluindo a referência ao Cliente dono
const MotoSchema = new Schema<IMoto>(
  {
    clienteId: { type: Schema.Types.ObjectId, ref: "Cliente", required: true, index: true },
    placa: { type: String, required: true, uppercase: true, trim: true },
    modelo: { type: String, required: true, trim: true },
    ano: { type: Number, required: true },
  },
  { timestamps: true }
);
// Cria o Model "Moto" a partir do Schema e da interface, usado no resto do backend para consultar e gravar dados na coleção "motos" do MongoDB
export const Moto = mongoose.model<IMoto>("Moto", MotoSchema);
//Alteração para commit da entrega - 28-09-2026