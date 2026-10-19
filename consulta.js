require("dotenv").config();
const mongoose = require("mongoose");

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  console.log("Banco:", db.databaseName);

  const ag = await db
    .collection("agendamentos")
    .find({ finalizadoEm: { $exists: true } })
    .sort({ finalizadoEm: -1 })
    .limit(3)
    .toArray();
  console.log("AGENDAMENTOS FINALIZADOS:", JSON.stringify(ag, null, 2));

  const sv = await db.collection("servicos").find().sort({ createdAt: -1 }).limit(3).toArray();
  console.log("SERVICOS:", JSON.stringify(sv, null, 2));

  await mongoose.disconnect();
})();