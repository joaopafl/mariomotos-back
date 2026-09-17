import { Request, Response, NextFunction } from "express";

/**
 * TEMPORARIO: enquanto a autenticacao completa (login com token) nao esta
 * implementada, o perfil do usuario é informado via header "x-user-perfil".
 * Quando o login/JWT for implementado, este middleware deve ler o perfil
 * a partir do token decodificado, nao de um header aberto.
 *
 * Uso no Postman: adicionar header  x-user-perfil: administrador
 */
export function exigirPerfil(...perfisPermitidos: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const perfil = req.header("x-user-perfil");

    if (!perfil) {
      return res.status(401).json({ erro: "Perfil do usuario nao informado (header x-user-perfil)." });
    }

    if (!perfisPermitidos.includes(perfil)) {
      return res.status(403).json({ erro: "Voce nao tem permissao para executar esta acao." });
    }

    next();
  };
}
