export type PerfilUsuario = "oficina" | "cliente";

export interface Cliente {
  id?: string;
  nome: string;
  telefone: string;
  email: string;
  criadoEm?: FirebaseFirestore.Timestamp;
}

export interface Moto {
  id?: string;
  clienteId: string;
  placa: string;
  modelo: string;
  ano: number;
}

export interface Servico {
  id?: string;
  motoId: string;
  tipoServico: string;
  data: string;
  valor: number;
  quilometragem?: number;
  observacoes?: string;
}

export interface Agendamento {
  id?: string;
  clienteId: string;
  motoId: string;
  data: string;
  horario: string;
  tipoServicoPrevisto: string;
  observacoes?: string;
}
