import { describe, expect, it } from "vitest";
import { safeNext, firstParam } from "@/lib/auth";
import { describeError, isApiError, isNetworkError, isAuthError } from "@/lib/errors";
import { formatPrice, formatMoney } from "@/lib/format";
import { ApiError } from "@/lib/api";

describe("safeNext (open-redirect guard)", () => {
  it("allows internal absolute paths", () => {
    expect(safeNext("/dashboard")).toBe("/dashboard");
    expect(safeNext("/courses/abc/roadmap")).toBe("/courses/abc/roadmap");
  });

  it("rejects protocol-relative and external URLs", () => {
    expect(safeNext("//evil.com")).toBe("/");
    expect(safeNext("/\\evil.com")).toBe("/");
    expect(safeNext("https://evil.com")).toBe("/");
    expect(safeNext("javascript:alert(1)")).toBe("/");
  });

  it("falls back for empty input and honours a custom fallback", () => {
    expect(safeNext(null)).toBe("/");
    expect(safeNext(undefined)).toBe("/");
    expect(safeNext("", "/login")).toBe("/login");
    expect(safeNext("//evil.com", "/login")).toBe("/login");
  });
});

describe("firstParam", () => {
  it("returns the first element of an array", () => {
    expect(firstParam("a")).toBe("a");
    expect(firstParam(["a", "b"])).toBe("a");
    expect(firstParam(undefined)).toBeUndefined();
  });
});

describe("describeError", () => {
  it("prefers documented copy for known codes", () => {
    expect(describeError(new ApiError(401, { code: "UNAUTHORIZED", message: "raw" }))).toMatch(/session expired/i);
  });

  it("falls back to the server message for unknown codes", () => {
    expect(describeError(new ApiError(400, { code: "WEIRD_CODE", message: "server says hi" }))).toBe("server says hi");
  });

  it("returns the provided fallback for unknown non-errors", () => {
    expect(describeError({}, "fallback text")).toBe("fallback text");
    expect(describeError(undefined)).toMatch(/something went wrong/i);
  });
});

describe("error predicates", () => {
  it("classifies ApiError instances", () => {
    const err = new ApiError(403, { code: "FORBIDDEN", message: "no" });
    expect(isApiError(err)).toBe(true);
    expect(isAuthError(err)).toBe(false);
    expect(isNetworkError(err)).toBe(false);
    expect(isAuthError(new ApiError(401, { code: "UNAUTHORIZED", message: "no" }))).toBe(true);
    expect(isNetworkError(new ApiError(0, { code: "NETWORK", message: "no" }))).toBe(true);
  });
});

describe("money formatting", () => {
  it("formatPrice shows Free only at zero", () => {
    expect(formatPrice(0)).toBe("Free");
    expect(formatPrice(50_000)).toContain("500");
  });

  it("formatMoney always renders a number, never Free", () => {
    expect(formatMoney(0)).not.toBe("Free");
    expect(formatMoney(0)).toContain("0");
  });
});
