import { connectCoreDB } from "../config/database";
import { usuarioService } from "../services/usuario.service";
import mongoose from "mongoose";

/**
 * Script de uso unico: cria o primeiro Administrador do sistema.
 * Necessario porque a rota POST /usuarios exige que quem chama JA SEJA
 * um Administrador autenticado - alguem precisa existir antes de tudo.
 *
 * Uso:
 *   npx ts-node src/scripts/seedAdmin.ts
 *
 * Ajuste o nome, e-mail e senha abaixo antes de rodar.
 */
async function seed() {
  await connectCoreDB();

  const email = "admin@mariomotos.com";
  const jaExiste = await usuarioService.buscarPorEmail(email);

  if (jaExiste) {
    console.log("Ja existe um usuario com esse e-mail. Nada foi criado.");
  } else {
    const admin = await usuarioService.criar({
      nome: "Administrador MarioMotos",
      email,
      senha: "admin123",
      perfil: "administrador",
    });
    console.log("Administrador criado com sucesso:");
    console.log({ id: admin._id, email: admin.email });
    console.log("\nIMPORTANTE: troque essa senha padrao apos o primeiro login.");
  }

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Erro ao criar administrador:", err);
  process.exit(1);
});
