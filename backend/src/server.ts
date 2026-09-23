import { createApp } from "./app.js";
import { config } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { prisma } from "./lib/prisma.js";

const app = createApp();

const server = app.listen(config.port, () => {
  logger.info(`Edu-Alt-Tech API listening on http://localhost:${config.port} (${config.env})`);
});

async function shutdown(signal: string): Promise<void> {
  logger.info(`${signal} received — shutting down`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
