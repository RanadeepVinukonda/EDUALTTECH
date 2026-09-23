import type { NextFunction, Request, Response } from "express";
import { config } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.path}`));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  let status = 500;
  let message = "Internal server error";
  let details: unknown;

  if (err instanceof ApiError) {
    status = err.status;
    message = err.message;
    details = err.details;
  } else if (err instanceof SyntaxError && "body" in err) {
    status = 400;
    message = "Malformed JSON body";
  } else if (err instanceof Error && isPrismaError(err)) {
    status = 400;
    message = clientMessageForPrisma(err);
  } else if (err instanceof Error) {
    message = config.env === "production" ? message : err.message;
  }

  if (status >= 500) {
    logger.error("Request failed", { requestId: req.requestId, err });
  } else if (config.env !== "test") {
    logger.warn("Request rejected", { requestId: req.requestId, status, message });
  }

  res.status(status).json({
    success: false,
    error: { message, details },
  });
}

function isPrismaError(err: Error): boolean {
  const name = err.constructor?.name ?? "";
  return name.startsWith("PrismaClient") || name === "PrismaClientKnownRequestError";
}

function clientMessageForPrisma(err: Error): string {
  const code = (err as { code?: string }).code;
  switch (code) {
    case "P2002":
      return "A record with that value already exists";
    case "P2025":
      return "Record not found or already deleted";
    case "P2003":
      return "Related record does not exist";
    default:
      return "Database constraint violation";
  }
}