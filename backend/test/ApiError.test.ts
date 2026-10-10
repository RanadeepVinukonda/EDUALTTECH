import { describe, expect, it } from "vitest";
import { ApiError } from "../src/utils/ApiError";

describe("ApiError", () => {
  it("derives the code from the status when none is given", () => {
    expect(new ApiError(404, "nope").code).toBe("NOT_FOUND");
    expect(new ApiError(401, "nope").code).toBe("UNAUTHORIZED");
    expect(new ApiError(500, "boom").code).toBe("INTERNAL_ERROR");
  });

  it("keeps an explicit code", () => {
    const err = new ApiError(409, "conflict", "ALREADY_ENROLLED");
    expect(err.status).toBe(409);
    expect(err.code).toBe("ALREADY_ENROLLED");
  });

  it("is an Error subclass with a message", () => {
    const err = ApiError.forbidden("nope");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.message).toBe("nope");
    expect(err.status).toBe(403);
  });

  it("badRequest treats a string argument as the code and an object as details", () => {
    expect(ApiError.badRequest("bad", "MY_CODE").code).toBe("MY_CODE");
    const withDetails = ApiError.badRequest("bad", { field: "email" });
    expect(withDetails.code).toBe("BAD_REQUEST");
    expect(withDetails.details).toEqual({ field: "email" });
  });

  it("maps each factory to the right status + code", () => {
    expect(ApiError.unauthorized()).toMatchObject({ status: 401, code: "UNAUTHORIZED" });
    expect(ApiError.notFound()).toMatchObject({ status: 404, code: "NOT_FOUND" });
    expect(ApiError.unprocessable("x")).toMatchObject({ status: 422, code: "VALIDATION_ERROR" });
    expect(ApiError.tooMany()).toMatchObject({ status: 429, code: "RATE_LIMITED" });
  });
});
