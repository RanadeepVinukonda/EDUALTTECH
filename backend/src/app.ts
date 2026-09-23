import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { config } from "./config/env.js";
import { notFoundHandler, errorHandler } from "./middlewares/error.js";
import { requestId } from "./middlewares/request-id.js";

import authRoutes from "./modules/auth/auth.routes.js";
import courseRoutes from "./modules/courses/courses.routes.js";
import practiceRoutes from "./modules/practice/practice.routes.js";
import aiRoutes from "./modules/ai/ai.routes.js";
import resourceRoutes from "./modules/resources/resources.routes.js";
import chatRoutes from "./modules/chat/chat.routes.js";
import notificationRoutes from "./modules/notifications/notifications.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import teacherRoutes from "./modules/teachers/teachers.routes.js";
import paymentRoutes from "./modules/payments/payments.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";
import contactRoutes from "./modules/contact/contact.routes.js";
import chapterRoutes from "./modules/chapters/chapters.routes.js";

export function createApp(): express.Express {
  const app = express();

  app.set("trust proxy", 1);
  app.use(requestId);
  app.use(helmet());
  app.use(cors({ origin: config.appOrigin, credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));

  if (config.env !== "test") {
    app.use(morgan(config.env === "production" ? "combined" : "dev"));
  }

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 600,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { success: false, error: { message: "Too many requests, please slow down." } },
  });

  app.use("/api", apiLimiter);

  app.get("/health", (_req, res) => {
    res.json({ success: true, data: { status: "ok", service: "edu-alt-tech-api", env: config.env } });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/courses", courseRoutes);
  app.use("/api/practice", practiceRoutes);
  app.use("/api/ai", aiRoutes);
  app.use("/api/resources", resourceRoutes);
  app.use("/api/chat", chatRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/teachers", teacherRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/contact", contactRoutes);
  app.use("/api/chapters", chapterRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
