import { db } from "../config/database";
import { Agendamento } from "../types";

const COLLECTION = "agendamentos";

export const agendamentoService = {
  async criar(dados: Agendamento): Promise<Agendamento> {
    // RN03 / RF11: nao permitir dois agendamentos no mesmo horario
    const conflito = await db
      .collection(COLLECTION)
      .where("data", "==", dados.data)
      .where("horario", "==", dados.horario)
      .get();

    if (!conflito.empty) {
      throw new Error("Ja existe um agendamento nesse horario. Escolha outro horario.");
    }

    const docRef = await db.collection(COLLECTION).add(dados);
    return { id: docRef.id, ...dados };
  },

  async listarPorDia(data: string): Promise<Agendamento[]> {
    const snapshot = await db
      .collection(COLLECTION)
      .where("data", "==", data)
      .orderBy("horario")
      .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Agendamento));
  },

  async listarPorCliente(clienteId: string): Promise<Agendamento[]> {
    const snapshot = await db
      .collection(COLLECTION)
      .where("clienteId", "==", clienteId)
      .orderBy("data")
      .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Agendamento));
  },
};
