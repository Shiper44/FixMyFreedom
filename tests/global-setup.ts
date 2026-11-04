// Prepara la base de datos de TEST: vacía su esquema, aplica las migraciones
// y carga las carteras de ejemplo. Nunca se ejecuta contra otra base de datos.
import { execSync } from "node:child_process";

export default async function setup() {
  const url = process.env.DATABASE_URL_TEST ?? "postgresql://fmf:fmf@localhost:5432/fixmyfreedom_test";
  const nombreBd = new URL(url).pathname.slice(1);
  if (!/_test$/.test(nombreBd)) throw new Error(`La base de datos de test debe terminar en _test (es «${nombreBd}»)`);

  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient({ datasourceUrl: url });
  await prisma.$executeRawUnsafe("DROP SCHEMA IF EXISTS public CASCADE");
  await prisma.$executeRawUnsafe("CREATE SCHEMA public");
  execSync("npx prisma migrate deploy", { stdio: "ignore", env: { ...process.env, DATABASE_URL: url } });

  const { sembrar } = await import("../prisma/seed");
  await sembrar(prisma);
  await prisma.$disconnect();
}
