export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code ?? statusToCode(status);
    this.details = details;
  }

  static badRequest(message: string, codeOrDetails?: unknown) {
    if (typeof codeOrDetails === "string") return new ApiError(400, message, codeOrDetails);
    return new ApiError(400, message, "BAD_REQUEST", codeOrDetails);
  }
  static unauthorized(message = "Authentication required") {
    return new ApiError(401, message, "UNAUTHORIZED");
  }
  static forbidden(message = "Insufficient permissions", code?: string) {
    return new ApiError(403, message, code);
  }
  static notFound(message = "Not found") {
    return new ApiError(404, message, "NOT_FOUND");
  }
  static conflict(message: string, code?: string) {
    return new ApiError(409, message, code);
  }
  static unprocessable(message: string, details?: unknown) {
    return new ApiError(422, message, "VALIDATION_ERROR", details);
  }
  static tooMany(message = "Too many requests, please slow down.") {
    return new ApiError(429, message, "RATE_LIMITED");
  }
}

function statusToCode(status: number): string {
  switch (status) {
    case 400: return "BAD_REQUEST";
    case 401: return "UNAUTHORIZED";
    case 403: return "FORBIDDEN";
    case 404: return "NOT_FOUND";
    case 409: return "CONFLICT";
    case 422: return "VALIDATION_ERROR";
    case 429: return "RATE_LIMITED";
    default: return "INTERNAL_ERROR";
  }
}
