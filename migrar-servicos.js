require("dotenv").config();
const mongoose = require("mongoose");

const gravar = process.argv.includes("--gravar");

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  console.log("Banco:", db.databaseName, gravar ? "(GRAVANDO)" : "(simulacao, nada sera gravado)");

  const pendentes = await db
    .collection("agendamentos")
    .find({ finalizadoEm: { $exists: true }, servicoId: { $exists: false } })
    .sort({ finalizadoEm: 1 })
    .toArray();
  console.log("Atendimentos finalizados sem servico:", pendentes.length);

  for (const ag of pendentes) {
    const tipo = await db.collection("tiposervicos").findOne({ nome: ag.tipoServicoPrevisto });
    const valor = tipo && typeof tipo.valorPadrao === "number" ? tipo.valorPadrao : 0;
    console.log(
      `- ${ag.data} ${ag.horario} | ${ag.tipoServicoPrevisto} | valor ${valor}${tipo ? "" : " (fora do catalogo)"}`
    );
    if (!gravar) continue;

    const quando = ag.finalizadoEm;
    const r = await db.collection("servicos").insertOne({
      motoId: ag.motoId,
      tipoServico: ag.tipoServicoPrevisto,
      data: ag.data,
      valor,
      observacoes: ag.observacoesAtendimento || "",
      ativo: true,
      createdAt: quando,
      updatedAt: quando,
      __v: 0,
    });
    await db
      .collection("agendamentos")
      .updateOne({ _id: ag._id }, { $set: { servicoId: r.insertedId, valorFinal: valor } });
  }

  await mongoose.disconnect();
})();