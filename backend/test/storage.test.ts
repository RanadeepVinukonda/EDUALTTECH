import { describe, it, expect } from "vitest";
import { assertPublicImage } from "../src/lib/storage.js";

const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const gif = Buffer.from("GIF89a\x01\x00", "binary");
const webp = Buffer.concat([Buffer.from("RIFF"), Buffer.from([0x10, 0, 0, 0]), Buffer.from("WEBP")]);

describe("assertPublicImage", () => {
  it("accepts matching raster signatures", () => {
    expect(() => assertPublicImage("photo.png", png)).not.toThrow();
    expect(() => assertPublicImage("photo.jpg", jpeg)).not.toThrow();
    expect(() => assertPublicImage("photo.JPEG", jpeg)).not.toThrow();
    expect(() => assertPublicImage("photo.gif", gif)).not.toThrow();
    expect(() => assertPublicImage("photo.webp", webp)).not.toThrow();
  });

  it("rejects SVG for public uploads", () => {
    expect(() => assertPublicImage("icon.svg", Buffer.from("<svg/>"))).toThrow(/PNG, JPEG/);
  });

  it("rejects content that does not match the extension", () => {
    expect(() => assertPublicImage("photo.png", jpeg)).toThrow(/does not match/);
    expect(() => assertPublicImage("photo.jpg", Buffer.from("<svg/>"))).toThrow(/does not match/);
  });

  it("rejects empty files", () => {
    expect(() => assertPublicImage("photo.png", Buffer.alloc(0))).toThrow(/empty/);
  });
});
