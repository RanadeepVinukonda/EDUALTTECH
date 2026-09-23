import { PrismaClient } from "@prisma/client";
import { config } from "../config/env.js";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__prisma ??
  new PrismaClient({
    log: config.env === "development" ? ["warn", "error"] : ["error"],
  });

if (config.env !== "production") {
  globalThis.__prisma = prisma;
}
