import mongoose from "mongoose";
import { env } from "./env";

export async function connectCoreDB(): Promise<void> {
  if (!env.mongoUri) {
    throw new Error("MONGO_URI nao definida no .env");
  }
  await mongoose.connect(env.mongoUri);
  console.log("MongoDB conectado");
}
