import { describe, expect, it } from "vitest";
import { getClientIp } from "@/lib/security/clientIp";

const h = (init: Record<string, string>) => new Headers(init);

describe("getClientIp — ordem e cabeçalhos forjados (T-SEG-U02)", () => {
  it("prefere x-real-ip", () => {
    expect(getClientIp(h({ "x-real-ip": "203.0.113.5", "x-forwarded-for": "198.51.100.7" }))).toBe("203.0.113.5");
  });

  it("usa o primeiro item de x-forwarded-for quando não há x-real-ip", () => {
    expect(getClientIp(h({ "x-forwarded-for": "198.51.100.7, 10.0.0.1, 10.0.0.2" }))).toBe("198.51.100.7");
  });

  it("ignora cf-connecting-ip por padrão (PV-07 não confirmada)", () => {
    expect(getClientIp(h({ "cf-connecting-ip": "192.0.2.50" }))).toBeNull();
    expect(getClientIp(h({ "cf-connecting-ip": "192.0.2.50", "x-real-ip": "203.0.113.5" }))).toBe("203.0.113.5");
  });

  it("lê cf-connecting-ip somente com a confiança no Cloudflare habilitada e como último recurso", () => {
    expect(getClientIp(h({ "cf-connecting-ip": "192.0.2.50" }), { trustCloudflare: true })).toBe("192.0.2.50");
    expect(
      getClientIp(h({ "cf-connecting-ip": "192.0.2.50", "x-real-ip": "203.0.113.5" }), { trustCloudflare: true }),
    ).toBe("203.0.113.5");
  });

  it("aceita IPv6", () => {
    expect(getClientIp(h({ "x-real-ip": "2001:db8::1" }))).toBe("2001:db8::1");
  });

  it("devolve null, sem inventar endereço, quando não há cabeçalhos", () => {
    expect(getClientIp(h({}))).toBeNull();
    expect(getClientIp(h({}), { trustCloudflare: true })).toBeNull();
  });

  it.each([
    ["texto livre", "unknown"],
    ["injeção", "1.2.3.4; DROP TABLE leads"],
    ["octeto fora da faixa", "999.1.1.1"],
    ["vazio", "   "],
    ["lista em x-real-ip", "1.2.3.4, 5.6.7.8"],
  ])("rejeita valor forjado ou malformado em x-real-ip (%s)", (_n, value) => {
    expect(getClientIp(h({ "x-real-ip": value }))).toBeNull();
  });

  it("cai para x-forwarded-for quando x-real-ip é malformado", () => {
    expect(getClientIp(h({ "x-real-ip": "lixo", "x-forwarded-for": "198.51.100.7" }))).toBe("198.51.100.7");
  });

  it("rejeita primeiro item malformado de x-forwarded-for sem usar os seguintes", () => {
    expect(getClientIp(h({ "x-forwarded-for": "lixo, 198.51.100.7" }))).toBeNull();
  });
});
