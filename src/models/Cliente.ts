import mongoose, { Document, Schema } from "mongoose";

export interface ICliente extends Document {
  nome: string;
  telefone: string;
  email: string;
  cpf?: string;
  senhaHash: string;
  emailConfirmado: boolean;
  ativo: boolean;
  codigoHash?: string;
  codigoExpiraEm?: Date;
  tentativasCodigo: number;
  createdAt: Date;
  updatedAt: Date;
}

const ClienteSchema = new Schema<ICliente>(
  {
    nome: { type: String, required: true, trim: true },
    telefone: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // somente digitos; unico, mas opcional para clientes antigos (indice "sparse")
    cpf: { type: String, unique: true, sparse: true, trim: true },
    senhaHash: { type: String, required: true },
    // true por padrao: clientes ja existentes e criados pelo admin nao precisam confirmar
    emailConfirmado: { type: Boolean, default: true },
    // desativar em vez de excluir: preserva historico, relatorios e rastreamento
    ativo: { type: Boolean, default: true },
    codigoHash: { type: String, select: false },
    codigoExpiraEm: { type: Date },
    tentativasCodigo: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Cliente = mongoose.model<ICliente>("Cliente", ClienteSchema);
