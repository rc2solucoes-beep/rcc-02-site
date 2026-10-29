import { describe, expect, it } from "vitest";
import {
  generateToken,
  generateTokenPair,
  hashToken,
  isTokenHash,
  isWellFormedToken,
  TOKEN_LENGTH,
} from "@/lib/newsletter/tokens";

// T-NL-U01 e T-NL-U02 (SDD Newsletter §17).
describe("tokens da newsletter", () => {
  it("formato: prefixo nlt_, 47 caracteres, charset base64url", () => {
    const token = generateToken();
    expect(token).toHaveLength(TOKEN_LENGTH);
    expect(TOKEN_LENGTH).toBe(47);
    expect(token.startsWith("nlt_")).toBe(true);
    expect(isWellFormedToken(token)).toBe(true);
  });

  it("rejeita entradas malformadas ou grandes antes do banco", () => {
    const valid = generateToken();
    const malformed: unknown[] = [
      "", "nlt_", "x".repeat(47), valid.slice(1), valid + "a", "NLT_" + valid.slice(4),
      "nlt_" + "+".repeat(43), "nlt_" + "=".repeat(43), valid.replace("nlt_", "nlt-"),
      "nlt_" + "a".repeat(10_000), null, undefined, 42, {},
    ];
    for (const bad of malformed) expect(isWellFormedToken(bad)).toBe(false);
    expect(() => hashToken("nlt_curto")).toThrow(TypeError);
  });

  it("gera 32 bytes de entropia: tokens únicos entre milhares de gerações", () => {
    const seen = new Set(Array.from({ length: 2000 }, () => generateToken()));
    expect(seen.size).toBe(2000);
  });

  it("SHA-256 estável (hex, 64 caracteres) e diferente do token bruto", () => {
    const token = "nlt_" + "A".repeat(43);
    expect(hashToken(token)).toBe(hashToken(token));
    expect(isTokenHash(hashToken(token))).toBe(true);
    expect(hashToken(token)).not.toContain(token);
    expect(hashToken(token)).not.toBe(hashToken("nlt_" + "B".repeat(43)));
  });

  it("par bruto+hash: o hash corresponde ao bruto", () => {
    const pair = generateTokenPair();
    expect(hashToken(pair.raw)).toBe(pair.hash);
  });
});
