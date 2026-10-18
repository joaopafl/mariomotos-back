import fs from "fs";
import { App, cert, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { env } from "../config/env";
import { Dispositivo } from "../models/Dispositivo";

let app: App | null = null;
let jaTentou = false;

function obterApp(): App | null {
  if (app) return app;
  if (jaTentou) return null;
  jaTentou = true;

  if (!env.firebaseServiceAccountPath) {
    console.warn("Notificacoes desativadas: FIREBASE_SERVICE_ACCOUNT_PATH nao esta definido no .env.");
    return null;
  }
  try {
    const conta = JSON.parse(fs.readFileSync(env.firebaseServiceAccountPath, "utf-8"));
    app = initializeApp({ credential: cert(conta) });
    console.log("Notificacoes (Firebase) ativadas.");
    return app;
  } catch (err) {
    console.error("Notificacoes desativadas: nao foi possivel ler a chave do Firebase:", (err as Error).message);
    return null;
  }
}

const TOKENS_INVALIDOS = [
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
  "messaging/invalid-argument",
];

export const notificacaoService = {
  /** Envia um push para todos os aparelhos do cliente. Nunca lanca erro: o envio e "melhor esforco". */
  async avisarCliente(
    clienteId: string,
    aviso: { titulo: string; corpo: string; dados?: Record<string, string> }
  ): Promise<void> {
    try {
      const firebase = obterApp();
      if (!firebase) return;

      const dispositivos = await Dispositivo.find({ clienteId });
      if (dispositivos.length === 0) return;
      const tokens = dispositivos.map((d) => d.token);

      const resultado = await getMessaging(firebase).sendEachForMulticast({
        tokens,
        notification: { title: aviso.titulo, body: aviso.corpo },
        data: aviso.dados ?? {},
        android: { priority: "high" },
      });

      const invalidos: string[] = [];
      resultado.responses.forEach((r, i) => {
        if (!r.success && r.error && TOKENS_INVALIDOS.includes(r.error.code)) {
          invalidos.push(tokens[i]);
        }
      });
      if (invalidos.length > 0) {
        await Dispositivo.deleteMany({ token: { $in: invalidos } });
      }
    } catch (err) {
      console.error("Falha ao enviar notificacao:", (err as Error).message);
    }
  },
};
