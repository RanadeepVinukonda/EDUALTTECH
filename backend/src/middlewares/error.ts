import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";
import { config } from "../config/env.js";
import { Prisma } from "@prisma/client";

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Route not found" } });
}

function translate(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") return ApiError.conflict("That value already exists");
    if (err.code === "P2025") return ApiError.notFound("Resource not found");
    if (err.code === "P2003") return ApiError.badRequest("Related resource is missing");
  }
  if (err instanceof SyntaxError && "body" in err) return ApiError.badRequest("Malformed JSON body");
  return new ApiError(500, "Something went wrong. Please try again.");
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const apiError = translate(err);
  const status = apiError.status;

  if (status >= 500) {
    logger.error("request failed", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      err: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack?.split("\n").slice(0, 4).join(" | ") : undefined,
    });
  } else {
    logger.debug("request rejected", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      status,
      message: apiError.message,
    });
  }

  res.status(status).json({
    success: false,
    error: {
      code: apiError.code,
      message: status >= 500 && config.isProd ? "Something went wrong. Please try again." : apiError.message,
      ...(apiError.details !== undefined ? { details: apiError.details } : {}),
      requestId: req.requestId,
    },
  });
}
