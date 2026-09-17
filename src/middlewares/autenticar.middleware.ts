import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { TokenPayload } from "../services/auth.service";

// Extende o tipo Request do Express para carregar o usuario autenticado
declare global {
  namespace Express {
    interface Request {
      usuarioAutenticado?: TokenPayload;
    }
  }
}

/**
 * Verifica o token JWT enviado no header Authorization: Bearer <token>.
 * Se valido, popula req.usuarioAutenticado com { id, nome, perfil }.
 */
export function autenticar(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ erro: "Token nao informado. Faca login novamente." });
  }

  const token = authHeader.substring(7);

  try {
    const payload = jwt.verify(token, env.jwtSecret) as TokenPayload;
    req.usuarioAutenticado = payload;
    next();
  } catch (err) {
    return res.status(401).json({ erro: "Token invalido ou expirado. Faca login novamente." });
  }
}

/**
 * Deve ser usado APOS o middleware "autenticar".
 * Verifica se o perfil do usuario autenticado esta entre os perfis permitidos.
 */
export function autorizar(...perfisPermitidos: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.usuarioAutenticado) {
      return res.status(401).json({ erro: "Usuario nao autenticado." });
    }
    if (!perfisPermitidos.includes(req.usuarioAutenticado.perfil)) {
      return res.status(403).json({ erro: "Voce nao tem permissao para executar esta acao." });
    }
    next();
  };
}
