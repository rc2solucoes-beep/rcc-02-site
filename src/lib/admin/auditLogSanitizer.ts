const SENSITIVE_METADATA_KEYS = new Set([
  "password",
  "token",
  "bootstraptoken",
  "authorization",
  "cookie",
  "servicerole",
  "secret",
  "apikey",
  "accesstoken",
  "refreshtoken",
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (isPlainObject(value)) {
    const output: Record<string, unknown> = {};
    for (const [key, raw] of Object.entries(value)) {
      if (SENSITIVE_METADATA_KEYS.has(key.toLowerCase())) {
        continue;
      }
      output[key] = sanitizeValue(raw);
    }
    return output;
  }

  return value;
}

export function sanitizeAuditMetadata(
  metadata: Record<string, unknown> | null
): Record<string, unknown> | null {
  if (!metadata) {
    return null;
  }

  return sanitizeValue(metadata) as Record<string, unknown>;
}

export function formatAuditMetadataPreview(
  metadata: Record<string, unknown> | null,
  maxLength = 200
): string {
  const sanitized = sanitizeAuditMetadata(metadata);
  if (!sanitized) {
    return "—";
  }

  let text = JSON.stringify(sanitized);
  if (!text || text === "{}") {
    return "—";
  }

  text = text.replace(/[<>]/g, "");
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, Math.max(0, maxLength - 1))}…`;
}
