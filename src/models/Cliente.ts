//importa tres ferramentas da biblioteca mongoose:  Mongoose o pacote principal,
// schema para definir quais campos o cliente possui e Document para definir que o mesmo é um doc do mongodb 
// idenificado atraves do seu id
import mongoose, { Document, Schema } from "mongoose";

//export permite que outros arquivos usem essa interface e define o formato de de atributos dos objetos que serão aceitos
export interface ICliente extends Document {
  nome: string;
  telefone: string;
  email: string;
  senhaHash: string;
  createdAt: Date;
  updatedAt: Date;
}
// Define e valida a estrutura dos dados de Cliente que serão realmente salvos no MongoDB, com regras aplicadas em tempo de execução.
const ClienteSchema = new Schema<ICliente>(
  {
    nome: { type: String, required: true, trim: true },
    telefone: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    senhaHash: { type: String, required: true },
  },
  { timestamps: true }
);
// Cria o Model "Cliente" a partir do Schema e da interface, usado no resto do backend para consultar e gravar dados na coleção "clientes" do MongoDB.
export const Cliente = mongoose.model<ICliente>("Cliente", ClienteSchema);
