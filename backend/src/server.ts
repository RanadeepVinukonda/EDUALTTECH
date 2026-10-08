import "dotenv/config";
import { createApp, logStartupFailure } from "./app.js";
import { config } from "./config/env.js";
import { logger } from "./utils/logger.js";

async function main(): Promise<void> {
  const app = createApp();
  const server = app.listen(config.port, () => {
    logger.info("server listening", { port: config.port, env: config.env });
  });

  const shutdown = (signal: string) => {
    logger.info("shutting down", { signal });
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  logStartupFailure(err);
  process.exit(1);
});
