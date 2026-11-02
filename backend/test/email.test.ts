import { describe, it, expect } from "vitest";
import { escapeHtml, escapeSubject, layout } from "../src/lib/email.js";

describe("email escaping", () => {
  it("escapes HTML metacharacters including quotes and apostrophes", () => {
    expect(escapeHtml(`<img src=x onerror="alert('x')">&`)).toBe(
      "&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;&amp;",
    );
  });

  it("escapes the layout title, CTA and footer", () => {
    const html = layout("<script>alert(1)</script>", "body", "<b>Go</b>", "https://x.test/?a=1&b=2", "<footer>");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&lt;b&gt;Go&lt;/b&gt;");
    expect(html).toContain("https://x.test/?a=1&amp;b=2");
    expect(html).toContain("&lt;footer&gt;");
  });

  it("leaves deliberately formatted intro markup intact", () => {
    const html = layout("Title", "Hello <strong>learner</strong>");
    expect(html).toContain("Hello <strong>learner</strong>");
  });

  it("strips control characters from subjects to prevent header injection", () => {
    expect(escapeSubject("Reset\r\nBcc: evil@example.test")).toBe("Reset Bcc: evil@example.test");
    expect(escapeSubject("  spaced\t\tsubject  ")).toBe("spaced subject");
    expect(escapeSubject("x".repeat(300))).toHaveLength(200);
  });
});
