import type { RequestHandler } from "express";
import type { ZodTypeAny } from "zod";
import { ApiError } from "../utils/ApiError.js";

type Part = "body" | "query" | "params";

export const validate =
  (schema: ZodTypeAny, part: Part = "body"): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      return next(ApiError.badRequest("Validation failed", result.error.flatten()));
    }
    if (part === "query") {
      // Express 5: req.query is a getter-only; assign validated copy onto request via cast
      Object.defineProperty(req, "query", { value: result.data, writable: true, configurable: true });
    } else {
      req[part] = result.data;
    }
    next();
  };
