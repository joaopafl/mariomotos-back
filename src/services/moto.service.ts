import { db } from "../config/database";
import { Moto } from "../types";

const COLLECTION = "motos";

export const motoService = {
  async criar(dados: Moto): Promise<Moto> {
    const docRef = await db.collection(COLLECTION).add(dados);
    return { id: docRef.id, ...dados };
  },

  async listarPorCliente(clienteId: string): Promise<Moto[]> {
    const snapshot = await db.collection(COLLECTION).where("clienteId", "==", clienteId).get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Moto));
  },

  async buscarPorId(id: string): Promise<Moto | null> {
    const doc = await db.collection(COLLECTION).doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Moto;
  },

  async atualizar(id: string, dados: Partial<Moto>): Promise<void> {
    await db.collection(COLLECTION).doc(id).update(dados);
  },

  async deletar(id: string): Promise<void> {
    await db.collection(COLLECTION).doc(id).delete();
  },
};
