import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { connectCoreDB } from "./config/database";

import clientesRoutes from "./routes/clientes.routes";
import motosRoutes from "./routes/motos.routes";
import servicosRoutes from "./routes/servicos.routes";
import agendamentosRoutes from "./routes/agendamentos.routes";
import usuariosRoutes from "./routes/usuarios.routes";
import relatoriosRoutes from "./routes/relatorios.routes";
import relatorioResumoRoutes from "./routes/relatorioResumo.routes";
import authRoutes from "./routes/auth.routes";
import tiposServicoRoutes from "./routes/tiposServico.routes";
import horariosRoutes from "./routes/horarios.routes";
import dispositivosRoutes from "./routes/dispositivos.routes";
import { iniciarLembretes } from "./services/lembrete.service";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, api: "mariomotos-backend" });
});

app.use("/auth", authRoutes);
app.use("/clientes", clientesRoutes);
app.use("/motos", motosRoutes);
app.use("/servicos", servicosRoutes);
app.use("/agendamentos", agendamentosRoutes);
app.use("/usuarios", usuariosRoutes);
app.use("/relatorios", relatoriosRoutes);
app.use("/relatorios", relatorioResumoRoutes);
app.use("/tipos-servico", tiposServicoRoutes);
app.use("/horarios", horariosRoutes);
app.use("/dispositivos", dispositivosRoutes);

async function start() {
  try {
    await connectCoreDB();
    iniciarLembretes();
    app.listen(env.port, () => {
      console.log(`Servidor MarioMotos rodando em http://localhost:${env.port}`);
    });
  } catch (err) {
    console.error("Falha ao iniciar servidor:", err);
    process.exit(1);
  }
}

start();
