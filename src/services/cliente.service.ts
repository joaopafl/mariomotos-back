import { db } from "../config/database";
import { Cliente } from "../types";
import admin from "../config/database";

const COLLECTION = "clientes";

export const clienteService = {
  async criar(dados: Cliente): Promise<Cliente> {
    const docRef = await db.collection(COLLECTION).add({
      ...dados,
      criadoEm: admin.firestore.Timestamp.now(),
    });
    return { id: docRef.id, ...dados };
  },

  async listarTodos(): Promise<Cliente[]> {
    const snapshot = await db.collection(COLLECTION).orderBy("nome").get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Cliente));
  },

  async buscarPorId(id: string): Promise<Cliente | null> {
    const doc = await db.collection(COLLECTION).doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Cliente;
  },

  async buscarPorNomeOuPlaca(termo: string): Promise<Cliente[]> {
    // Busca simples por nome (Firestore nao suporta LIKE nativo).
    // Para producao, considerar Algolia/Typesense se a base crescer muito.
    const snapshot = await db.collection(COLLECTION).get();
    const termoLower = termo.toLowerCase();
    return snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as Cliente))
      .filter((c) => c.nome.toLowerCase().includes(termoLower));
  },

  async atualizar(id: string, dados: Partial<Cliente>): Promise<void> {
    await db.collection(COLLECTION).doc(id).update(dados);
  },

  async deletar(id: string): Promise<void> {
    await db.collection(COLLECTION).doc(id).delete();
  },
};
