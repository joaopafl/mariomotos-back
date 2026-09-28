//Importação da Biblioteca Mongoose
import mongoose, { Document, Schema } from "mongoose";

// Define os únicos valores válidos para o perfil de um usuário, restringindo o tipo a essas duas strings. Isso é importante para o sistema saber a qual perfil pertence o usuario, bem como limitar a apenas estes dois perfis
export type PerfilUsuario = "funcionario" | "administrador";

//Padronização do formato dos dados que o sistema deverá aceitar 
export interface IUsuario extends Document {
  nome: string;
  email: string;
  senhaHash: string;
  perfil: PerfilUsuario;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}
//Definindo os tipos de dados e variaveis que serão gravadas no banco de dados - Tempo de execução
const UsuarioSchema = new Schema<IUsuario>(
  {
    nome: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    senhaHash: { type: String, required: true },
    perfil: { type: String, enum: ["funcionario", "administrador"], required: true, default: "funcionario" },
    ativo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

//Cria a model Usuario e o nome da coleção no mongoDb
export const Usuario = mongoose.model<IUsuario>("Usuario", UsuarioSchema);
