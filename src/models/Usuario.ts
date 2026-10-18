import mongoose, { Document, Schema } from "mongoose";

export type PerfilUsuario = "funcionario" | "administrador";

export interface IUsuario extends Document {
  nome: string;
  email: string;
  senhaHash: string;
  perfil: PerfilUsuario;
  cpf?: string;
  titulo?: string;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UsuarioSchema = new Schema<IUsuario>(
  {
    nome: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    senhaHash: { type: String, required: true },
    perfil: { type: String, enum: ["funcionario", "administrador"], required: true, default: "funcionario" },
    // somente digitos; unico, mas opcional para usuarios antigos
    cpf: { type: String, unique: true, sparse: true, trim: true },
    // profissao/cargo mostrado na saudacao (ex: Mecanico)
    titulo: { type: String, trim: true, default: "" },
    ativo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Usuario = mongoose.model<IUsuario>("Usuario", UsuarioSchema);
