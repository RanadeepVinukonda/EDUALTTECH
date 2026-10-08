import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import { config } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { requestId } from "./middlewares/request-id.js";
import { apiLimiter } from "./middlewares/rate-limit.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.js";

import authRoutes from "./modules/auth/auth.routes.js";
import coursesRoutes from "./modules/courses/courses.routes.js";
import roadmapRoutes from "./modules/courses/roadmap.routes.js";
import applicationsRoutes from "./modules/applications/applications.routes.js";
import paymentsRoutes from "./modules/payments/payments.routes.js";
import meetingsRoutes from "./modules/meetings/meetings.routes.js";
import resourcesRoutes from "./modules/resources/resources.routes.js";
import chatRoutes from "./modules/chat/chat.routes.js";
import notificationsRoutes from "./modules/notifications/notifications.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import wishlistRoutes from "./modules/wishlist/wishlist.routes.js";
import contactRoutes from "./modules/contact/contact.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";
import cmsRoutes from "./modules/cms/cms.routes.js";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(requestId);
  app.use(helmet());
  app.use(cors({ origin: config.appBaseUrl, credentials: true }));
  app.use(compression());
  if (!config.isProd) app.use(morgan("dev"));

  // rawBody kept for webhook HMAC verification (see payments.routes).
  app.use(
    express.json({
      limit: "2mb",
      verify: (req, _res, buf) => {
        (req as express.Request & { rawBody?: Buffer }).rawBody = Buffer.from(buf);
      },
    }),
  );
  app.use(express.urlencoded({ extended: true }));

  app.get("/health", (_req, res) => {
    res.json({ success: true, data: { ok: true, env: config.env } });
  });

  app.use("/api", apiLimiter);

  // roadmap before courses: two-segment content paths never collide with /:slug,
  // but explicit-first keeps routing intent readable.
  app.use("/api/courses", roadmapRoutes);
  app.use("/api/courses", coursesRoutes);
  app.use("/api/applications", applicationsRoutes);
  app.use("/api/payments", paymentsRoutes);
  app.use("/api/meetings", meetingsRoutes);
  app.use("/api/resources", resourcesRoutes);
  app.use("/api/chat", chatRoutes);
  app.use("/api/notifications", notificationsRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/wishlist", wishlistRoutes);
  app.use("/api/contact", contactRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/cms", cmsRoutes);
  app.use("/api/auth", authRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

// Log unexpected startup failures with context (empty catch = silent death).
export function logStartupFailure(err: unknown): void {
  logger.error("server failed to start", { err: err instanceof Error ? err.message : String(err) });
}
