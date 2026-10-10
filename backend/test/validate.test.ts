import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import type { NextFunction, Request, Response } from "express";
import { validate } from "../src/middlewares/validate.js";
import { ApiError } from "../src/utils/ApiError.js";

/** Mirrors Express 5: req.query is a getter-only accessor, not a data property. */
function makeReq(query: Record<string, string>, params: Record<string, string> = {}) {
  const req = { body: {}, params } as unknown as Request;
  Object.defineProperty(req, "query", {
    configurable: true,
    enumerable: true,
    get: () => query,
  });
  return req;
}

function run(handler: ReturnType<typeof validate>, req: Request) {
  const next = vi.fn<NextFunction>();
  handler(req, {} as Response, next);
  return next;
}

describe("validate middleware", () => {
  it("writes the zod-parsed query back to req.query (numbers, not strings)", () => {
    const req = makeReq({ page: "2", limit: "5" });
    const next = run(
      validate({ query: z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).default(12) }) }),
      req,
    );

    expect(next).toHaveBeenCalledWith();
    expect(req.query).toEqual({ page: 2, limit: 5 });
    expect(typeof (req.query as { page: unknown }).page).toBe("number");
  });

  it("applies defaults when the query is empty", () => {
    const req = makeReq({});
    run(validate({ query: z.object({ page: z.coerce.number().int().default(1), limit: z.coerce.number().int().default(12) }) }), req);

    expect(req.query).toEqual({ page: 1, limit: 12 });
  });

  it("writes parsed params back too", () => {
    const req = makeReq({}, { id: "42" });
    run(validate({ params: z.object({ id: z.coerce.number().int() }) }), req);

    expect(req.params).toEqual({ id: 42 });
  });

  it("forwards a 422 ApiError with field details on invalid query", () => {
    const req = makeReq({ page: "0" });
    const next = run(validate({ query: z.object({ page: z.coerce.number().int().min(1) }) }), req);

    const err = next.mock.calls[0][0] as unknown as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(422);
    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err.details).toEqual([{ field: "page", message: expect.any(String) }]);
  });
});
