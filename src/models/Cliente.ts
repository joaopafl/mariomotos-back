//importa tres ferramentas da biblioteca mongoose:  Mongoose o pacote principal,
// schema para definir quais campos o cliente possui e Document para definir que o mesmo é um doc do mongodb 
// idetificado atraves do seu id
import mongoose, { Document, Schema } from "mongoose";

//export habilita a função para outros arquivos
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
