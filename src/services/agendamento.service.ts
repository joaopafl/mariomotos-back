import { Agendamento, IAgendamento } from "../models/Agendamento";
import { Moto } from "../models/Moto";

export const agendamentoService = {
  async criar(dados: Partial<IAgendamento>): Promise<IAgendamento> {
    // RN07: moto deve pertencer ao cliente informado (tambem sustenta a RN13,
    // quando o proprio Cliente cria o agendamento a partir do app)
    const moto = await Moto.findById(dados.motoId);
    if (!moto) {
      throw new Error("Motocicleta nao encontrada.");
    }
    if (String(moto.clienteId) !== String(dados.clienteId)) {
      throw new Error("Esta motocicleta nao pertence ao cliente informado.");
    }

    // RN03 / RF11: nao permitir dois agendamentos no mesmo horario
    const conflito = await Agendamento.findOne({ data: dados.data, horario: dados.horario });
    if (conflito) {
      throw new Error("Ja existe um agendamento nesse horario. Escolha outro horario.");
    }
    return Agendamento.create(dados);
  },

  async listarPorDia(data: string): Promise<IAgendamento[]> {
    return Agendamento.find({ data }).sort({ horario: 1 });
  },

  async listarPorCliente(clienteId: string): Promise<IAgendamento[]> {
    return Agendamento.find({ clienteId }).sort({ data: 1 });
  },

  async buscarPorId(id: string): Promise<IAgendamento | null> {
    return Agendamento.findById(id);
  },

  async atualizar(id: string, dados: Partial<IAgendamento>): Promise<void> {
    // RN03 revalidado tambem na edicao, caso data/horario mudem
    if (dados.data && dados.horario) {
      const conflito = await Agendamento.findOne({
        _id: { $ne: id },
        data: dados.data,
        horario: dados.horario,
      });
      if (conflito) {
        throw new Error("Ja existe um agendamento nesse horario. Escolha outro horario.");
      }
    }
    await Agendamento.findByIdAndUpdate(id, dados);
  },

  async cancelar(id: string): Promise<void> {
    await Agendamento.findByIdAndDelete(id);
  },
};
