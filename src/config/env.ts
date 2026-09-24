//Importa biblioteca que lê arquivos .env
import dotenv from "dotenv";
//Comando usado para ler o .env
dotenv.config();
//Cria objeto unico com todas as informações do .env 
export const env = {
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGO_URI || "",
  jwtSecret: process.env.JWT_SECRET || "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
};
