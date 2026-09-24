//Importa a biblioteca mongoose: Ela é o driver para comunicação com o MongoDb
import mongoose from "mongoose";

//Cria um objeto com todas as variaveis do .env
import { env } from "./env";

//O export permite outros arquivos de importar esta função 
//O Async aguarda a conexão ocorrer, o que pode levar um tempo mais longo para acontecer
//o Promisse<void> aguarda um processo ser resolvido e não recebe dados de volta: neste caso, apenas conecta
export async function connectCoreDB(): Promise<void> {
  //Fail fast para problemas de aesso ao banco devolvendo mensagem amigavel
  if (!env.mongoUri) {
    throw new Error("MONGO_URI nao definida no .env");
  }
  //Aguarda conexão com o banco mongoDB e retona mensagem após conexão 
  await mongoose.connect(env.mongoUri);
  console.log("MongoDB conectado");
}
