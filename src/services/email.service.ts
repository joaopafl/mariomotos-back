import nodemailer from "nodemailer";
import { env } from "../config/env";

const transporte = nodemailer.createTransport({
  host: env.smtpHost,
  port: env.smtpPort,
  secure: env.smtpPort === 465,
  auth: { user: env.smtpUser, pass: env.smtpPass },
});

export const emailService = {
  async enviarSenhaTemporaria(destino: string, nome: string, senhaTemporaria: string): Promise<void> {
    await transporte.sendMail({
      from: `"MarioMotos" <${env.emailFrom}>`,
      to: destino,
      subject: "MarioMotos - redefinicao de senha",
      text:
        `Ola, ${nome}.\n\n` +
        `Recebemos um pedido para redefinir a sua senha.\n` +
        `Sua senha temporaria e: ${senhaTemporaria}\n\n` +
        `Entre no aplicativo com ela. Se voce nao fez esse pedido, procure a oficina.\n\n` +
        `MarioMotos`,
    });
  },

  async enviarCodigoConfirmacao(destino: string, nome: string, codigo: string): Promise<void> {
    await transporte.sendMail({
      from: `"MarioMotos" <${env.emailFrom}>`,
      to: destino,
      subject: "MarioMotos - confirme seu e-mail",
      text:
        `Ola, ${nome}.\n\n` +
        `Seu codigo de confirmacao e: ${codigo}\n\n` +
        `Ele vale por 15 minutos. Digite-o no aplicativo para ativar sua conta.\n` +
        `Se voce nao criou uma conta na MarioMotos, ignore este e-mail.\n\n` +
        `MarioMotos`,
    });
  },
};
