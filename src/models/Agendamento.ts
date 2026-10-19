import mongoose, { Document, Schema, Types } from "mongoose";

export interface IItemExtra {
  _id?: Types.ObjectId;
  tipoServico: string;
  valor: number;
  adicionadoEm: Date;
  servicoId?: Types.ObjectId;
}

export interface IAgendamento extends Document {
  clienteId: Types.ObjectId;
  motoId: Types.ObjectId;
  data: string;
  horario: string;
  tipoServicoPrevisto: string;
  observacoes?: string;
  iniciadoEm?: Date;
  finalizadoEm?: Date;
  atendenteId?: Types.ObjectId;
  atendenteNome?: string;
  atendenteTitulo?: string;
  observacoesAtendimento?: string;
  valorFinal?: number;
  valorPrincipal?: number;
  itensExtras?: IItemExtra[];
  duracaoMedidaSeg?: number;
  duracaoFinalSeg?: number;
  tempoAjustado?: boolean;
  motivoAjusteTempo?: string;
  servicoId?: Types.ObjectId;
  lembreteEnviadoEm?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AgendamentoSchema = new Schema<IAgendamento>(
  {
    clienteId: { type: Schema.Types.ObjectId, ref: "Cliente", required: true, index: true },
    motoId: { type: Schema.Types.ObjectId, ref: "Moto", required: true },
    data: { type: String, required: true, index: true },
    horario: { type: String, required: true },
    tipoServicoPrevisto: { type: String, required: true, trim: true },
    observacoes: { type: String, default: "" },
    // Atendimento: sem iniciadoEm = nao iniciado; com iniciadoEm e sem finalizadoEm = em atendimento
    iniciadoEm: { type: Date },
    finalizadoEm: { type: Date },
    atendenteId: { type: Schema.Types.ObjectId, ref: "Usuario" },
    atendenteNome: { type: String, trim: true },
    atendenteTitulo: { type: String, trim: true },
    observacoesAtendimento: { type: String, trim: true },
    // Valor cobrado e o servico gerado no historico ao finalizar
    valorFinal: { type: Number, min: 0 },
    valorPrincipal: { type: Number, min: 0 },
    // Servicos adicionais incluidos pelo mecanico durante o atendimento (do catalogo, com valor tabelado)
    itensExtras: {
      type: [
        new Schema(
          {
            tipoServico: { type: String, required: true, trim: true },
            valor: { type: Number, required: true, min: 0 },
            adicionadoEm: { type: Date, default: Date.now },
            servicoId: { type: Schema.Types.ObjectId, ref: "Servico" },
          },
          {}
        ),
      ],
      default: [],
    },
    // Tempo: o medido pelo servidor (inicio a fim) e o confirmado pelo mecanico na finalizacao
    duracaoMedidaSeg: { type: Number, min: 0 },
    duracaoFinalSeg: { type: Number, min: 0 },
    tempoAjustado: { type: Boolean },
    motivoAjusteTempo: { type: String, trim: true },
    servicoId: { type: Schema.Types.ObjectId, ref: "Servico" },
    // Controle do lembrete enviado um dia antes
    lembreteEnviadoEm: { type: Date },
  },
  { timestamps: true }
);

export const Agendamento = mongoose.model<IAgendamento>("Agendamento", AgendamentoSchema);
