import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { usuarioService } from "./usuario.service";
import { clienteService } from "./cliente.service";

export type PerfilToken = "funcionario" | "administrador" | "cliente";

export interface TokenPayload {
  id: string;
  nome: string;
  perfil: PerfilToken;
}

export const authService = {
  /**
   * RF01/RF02: login unico que identifica automaticamente o perfil.
   * Primeiro procura na colecao de Usuarios (equipe: funcionario/administrador);
   * se nao achar, procura na colecao de Clientes.
   */
  async login(email: string, senha: string): Promise<{ token: string; perfil: PerfilToken; nome: string; titulo: string }> {
    const usuario = await usuarioService.buscarPorEmail(email);

    if (usuario) {
      if (!usuario.ativo) {
        throw new Error("Conta desativada. Procure um administrador.");
      }
      const senhaConfere = await bcrypt.compare(senha, usuario.senhaHash);
      if (!senhaConfere) {
        throw new Error("E-mail ou senha invalidos.");
      }
      const payload: TokenPayload = { id: String(usuario._id), nome: usuario.nome, perfil: usuario.perfil };
      const token = jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"] });
      return { token, perfil: usuario.perfil, nome: usuario.nome, titulo: usuario.titulo || "" };
    }

    const cliente = await clienteService.buscarPorEmail(email);
    if (cliente) {
      const senhaConfere = await bcrypt.compare(senha, cliente.senhaHash);
      if (!senhaConfere) {
        throw new Error("E-mail ou senha invalidos.");
      }
      if (cliente.ativo === false) {
        throw new Error("Conta desativada. Procure a oficina.");
      }
      if (cliente.emailConfirmado === false) {
        throw new Error("Confirme seu e-mail para entrar. Enviamos um codigo para voce.");
      }
      const payload: TokenPayload = { id: String(cliente._id), nome: cliente.nome, perfil: "cliente" };
      const token = jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"] });
      return { token, perfil: "cliente", nome: cliente.nome, titulo: "" };
    }

    // Mensagem generica de proposito - nao revela se o problema foi email ou senha
    throw new Error("E-mail ou senha invalidos.");
  },
};
