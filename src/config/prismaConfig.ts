// Export Prisma Client with dynamic URL
import { PrismaClient } from "@prisma/client";
import { getDatabaseUrl } from "./database";

export async function getPrismaClient(): Promise<PrismaClient> {
  const databaseUrl = await getDatabaseUrl();
  return new PrismaClient({ datasources: { db: { url: databaseUrl } } });
}