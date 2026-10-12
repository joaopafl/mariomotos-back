import { Moto, IMoto } from "../models/Moto";
import { normalizarPlaca } from "../utils/validacao";

export interface DadosMoto {
  placa: string;
  modelo: string;
  ano: number | string;
}

/** Valida e normaliza os dados de uma moto. Lanca erro com mensagem clara se algo estiver errado. */
export function validarDadosMoto(dados: Partial<DadosMoto>): { placa: string; modelo: string; ano: number } {
  const placa = normalizarPlaca(String(dados.placa ?? ""));
  if (!placa) {
    throw new Error("Placa invalida. Use o formato ABC1234 ou ABC1D23.");
  }
  const modelo = String(dados.modelo ?? "").trim();
  if (!modelo) {
    throw new Error("Informe o modelo da moto.");
  }
  const ano = Number(dados.ano);
  const anoMaximo = new Date().getFullYear() + 1;
  if (!Number.isInteger(ano) || ano < 1900 || ano > anoMaximo) {
    throw new Error("Ano da moto invalido.");
  }
  return { placa, modelo, ano };
}

export const motoService = {
  async criar(dados: { clienteId: string } & Partial<DadosMoto>): Promise<IMoto> {
    const validos = validarDadosMoto(dados);
    return Moto.create({ clienteId: dados.clienteId, ...validos });
  },

  async listarPorCliente(clienteId: string): Promise<IMoto[]> {
    return Moto.find({ clienteId });
  },

  // Admin: todas as motos, independente do cliente
  async listarTodas(): Promise<IMoto[]> {
    return Moto.find().sort({ createdAt: -1 });
  },

  async buscarPorId(id: string): Promise<IMoto | null> {
    return Moto.findById(id);
  },

  async atualizar(id: string, dados: Partial<DadosMoto>): Promise<void> {
    const moto = await Moto.findById(id);
    if (!moto) throw new Error("Moto nao encontrada.");
    const validos = validarDadosMoto({
      placa: dados.placa ?? moto.placa,
      modelo: dados.modelo ?? moto.modelo,
      ano: dados.ano ?? moto.ano,
    });
    moto.placa = validos.placa;
    moto.modelo = validos.modelo;
    moto.ano = validos.ano;
    await moto.save();
  },

  /** Quantas motos ativas o cliente tem alem da informada. */
  async contarOutrasAtivas(clienteId: unknown, motoId: unknown): Promise<number> {
    return Moto.countDocuments({ clienteId, _id: { $ne: motoId }, ativa: { $ne: false } });
  },

  /** Desativa a moto, desde que o cliente continue com pelo menos uma ativa. */
  async desativar(id: string): Promise<void> {
    const moto = await Moto.findById(id);
    if (!moto) throw new Error("Moto nao encontrada.");
    if (moto.ativa === false) return;
    if ((await this.contarOutrasAtivas(moto.clienteId, moto._id)) === 0) {
      throw new Error("O cliente precisa ter pelo menos uma moto ativa.");
    }
    moto.ativa = false;
    await moto.save();
  },

  async reativar(id: string): Promise<void> {
    const moto = await Moto.findById(id);
    if (!moto) throw new Error("Moto nao encontrada.");
    moto.ativa = true;
    await moto.save();
  },
};
