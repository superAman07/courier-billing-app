// lib/prisma.ts
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL!;
if (!connectionString) throw new Error("Missing DATABASE_URL");

const adapter = new PrismaPg({ connectionString });

declare global {
  // cache in dev to avoid hot-reload multiple instances
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const prisma = global.__prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") global.__prisma = prisma;

export default prisma;
