/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodType } from "zod";
import { ApiError } from "../utils/ApiError.js";

interface Validated {
  body?: unknown;
  query?: unknown;
  params?: unknown;
}

/** Zod validation for body/query/params — 422 with per-field details. */
export function validate(schemas: { body?: ZodType; query?: ZodType; params?: ZodType }): RequestHandler<any, any, any, any, any> {
  return (req: Request<any>, _res: Response, next: NextFunction): void => {
    try {
      const out: Validated = {};
      if (schemas.body) out.body = schemas.body.parse(req.body);
      if (schemas.query) out.query = schemas.query.parse(req.query);
      if (schemas.params) out.params = schemas.params.parse(req.params);

      if (out.body !== undefined) (req as Request & { validatedBody?: unknown }).validatedBody = out.body;
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
