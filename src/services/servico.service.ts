import { db } from "../config/database";
import { Servico } from "../types";

const COLLECTION = "servicos";

export const servicoService = {
  async criar(dados: Servico): Promise<Servico> {
    // RN06: servico so pode ser criado vinculado a uma moto existente
    const moto = await db.collection("motos").doc(dados.motoId).get();
    if (!moto.exists) {
      throw new Error("Moto nao encontrada. Nao e possivel registrar servico.");
    }
    const docRef = await db.collection(COLLECTION).add(dados);
    return { id: docRef.id, ...dados };
  },

  async listarPorMoto(motoId: string): Promise<Servico[]> {
    const snapshot = await db
      .collection(COLLECTION)
      .where("motoId", "==", motoId)
      .orderBy("data", "desc")
      .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Servico));
  },
};
