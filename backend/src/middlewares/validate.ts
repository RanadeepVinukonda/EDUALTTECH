/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodType } from "zod";
import { ApiError } from "../utils/ApiError.js";

/**
 * Replaces a request accessor with the parsed value. Express 5 defines
 * `req.query` as a getter-only accessor, so a plain assignment is a no-op/
 * throws — an own data property shadows it instead.
 */
function setParsed(req: Request<any>, key: "query" | "params", value: unknown): void {
  Object.defineProperty(req, key, { value, writable: true, configurable: true, enumerable: true });
}

/** Zod validation for body/query/params — 422 with per-field details. */
export function validate(schemas: { body?: ZodType; query?: ZodType; params?: ZodType }): RequestHandler<any, any, any, any, any> {
  return (req: Request<any>, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) (req as Request & { validatedBody?: unknown }).validatedBody = schemas.body.parse(req.body);
      if (schemas.query) setParsed(req, "query", schemas.query.parse(req.query));
      if (schemas.params) setParsed(req, "params", schemas.params.parse(req.params));

      next();
    } catch (err) {
      if (err && typeof err === "object" && "issues" in err) {
        const issues = (err as { issues: Array<{ path: (string | number)[]; message: string }> }).issues;
        next(
          ApiError.unprocessable(
            "Please fix the highlighted fields",
            issues.map((i) => ({ field: i.path.join("."), message: i.message })),
          ),
        );
        return;
      }
      next(err);
    }
  };
}

/** The validated body (or raw req.body when no schema was given). */
export function body<T>(req: Request<any>): T {
  const v = (req as Request & { validatedBody?: unknown }).validatedBody;
  return (v ?? req.body) as T;
}
