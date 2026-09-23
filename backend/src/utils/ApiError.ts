export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
    Error.captureStackTrace?.(this, ApiError);
  }

  static badRequest(message = "Bad request", details?: unknown) {
    return new ApiError(400, message, details);
  }
  static unauthorized(message = "Unauthorized") {
    return new ApiError(401, message);
  }
  static forbidden(message = "Forbidden") {
    return new ApiError(403, message);
  }
  static notFound(message = "Not found") {
    return new ApiError(404, message);
  }
  static conflict(message = "Conflict") {
    return new ApiError(409, message);
  }
  static paymentRequired(message = "Payment required") {
    return new ApiError(402, message);
  }
  static tooMany(message = "Too many requests") {
    return new ApiError(429, message);
  }
  static badGateway(message = "Bad gateway") {
    return new ApiError(502, message);
  }
  static unavailable(message = "Service unavailable") {
    return new ApiError(503, message);
  }
  static internal(message = "Internal server error") {
    return new ApiError(500, message);
  }
}
