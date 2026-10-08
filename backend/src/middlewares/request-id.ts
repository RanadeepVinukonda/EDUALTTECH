import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId?: string;
      rawBody?: Buffer;
      user?: { id: string; email: string; role: "USER" | "ADMIN" };
    }
  }
}

export function requestId(req: Request, res: Response, next: NextFunction): void {
  const id = (req.headers["x-request-id"] as string | undefined)?.slice(0, 64) || randomUUID();
  req.requestId = id;
  res.setHeader("x-request-id", id);
  next();
}
