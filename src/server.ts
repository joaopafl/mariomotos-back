import express from "express";
import cors from "cors";
import { env } from "./config/env";

import clientesRoutes from "./routes/clientes.routes";
import motosRoutes from "./routes/motos.routes";
import servicosRoutes from "./routes/servicos.routes";
import agendamentosRoutes from "./routes/agendamentos.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, api: "mariomotos-backend" });
});

app.use("/clientes", clientesRoutes);
app.use("/motos", motosRoutes);
app.use("/servicos", servicosRoutes);
app.use("/agendamentos", agendamentosRoutes);

app.listen(env.port, () => {
  console.log(`Servidor MarioMotos rodando em http://localhost:${env.port}`);
});
