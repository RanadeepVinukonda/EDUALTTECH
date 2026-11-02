import { describe, it, expect } from "vitest";
import { booleanQuery } from "../src/lib/query.js";

describe("booleanQuery", () => {
  it("parses the two accepted literals", () => {
    expect(booleanQuery.parse("true")).toBe(true);
    expect(booleanQuery.parse("false")).toBe(false);
  });

  it("does not treat 'false' as truthy", () => {
    expect(booleanQuery.parse("false")).not.toBe(true);
  });

  it("rejects loose boolean spellings instead of guessing", () => {
    expect(() => booleanQuery.parse("1")).toThrow();
    expect(() => booleanQuery.parse("0")).toThrow();
    expect(() => booleanQuery.parse("yes")).toThrow();
  });

  it("stays optional when wrapped", () => {
    expect(booleanQuery.optional().parse(undefined)).toBeUndefined();
    expect(booleanQuery.optional().parse("true")).toBe(true);
  });
});
