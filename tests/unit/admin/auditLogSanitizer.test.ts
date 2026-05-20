import { describe, expect, it } from "vitest";
import { formatAuditMetadataPreview, sanitizeAuditMetadata } from "@/lib/admin/auditLogSanitizer";

describe("auditLogSanitizer", () => {
  it("removes sensitive keys case-insensitively", () => {
    const sanitized = sanitizeAuditMetadata({
      token: "abc",
      Authorization: "x",
      nested: {
        Password: "y",
        keep: "ok",
      },
      keepTop: true,
    });

    expect(sanitized).toEqual({
      nested: { keep: "ok" },
      keepTop: true,
    });
  });

  it("formats null metadata as dash", () => {
    expect(formatAuditMetadataPreview(null)).toBe("—");
  });

  it("truncates preview to max length", () => {
    const preview = formatAuditMetadataPreview({ text: "x".repeat(500) }, 200);
    expect(preview.length).toBeLessThanOrEqual(200);
  });
});
