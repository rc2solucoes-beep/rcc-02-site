import { describe, it, expect } from "vitest";
import { services, getServiceBySlug } from "@/lib/content/services";

describe("services content", () => {
  it("lista 5 serviços", () => {
    expect(services).toHaveLength(5);
  });

  it("cada serviço tem campos obrigatórios", () => {
    services.forEach((s) => {
      expect(s.slug).toBeTruthy();
      expect(s.title).toBeTruthy();
      expect(s.shortTitle).toBeTruthy();
      expect(s.summary).toBeTruthy();
      expect(s.description).toBeTruthy();
      expect(Array.isArray(s.items)).toBe(true);
      expect(s.items.length).toBeGreaterThan(0);
      expect(Array.isArray(s.benefits)).toBe(true);
      expect(s.benefits.length).toBeGreaterThan(0);
    });
  });

  it("slugs são únicos", () => {
    const slugs = services.map((s) => s.slug);
    const unique = new Set(slugs);
    expect(unique.size).toBe(slugs.length);
  });

  it("slugs seguem formato kebab-case", () => {
    services.forEach((s) => {
      expect(s.slug).toMatch(/^[a-z0-9-]+$/);
    });
  });

  it("getServiceBySlug retorna serviço correto", () => {
    const service = getServiceBySlug("automacoes-com-ia");
    expect(service).not.toBeNull();
    expect(service?.slug).toBe("automacoes-com-ia");
  });

  it("getServiceBySlug retorna undefined para slug inválido", () => {
    const service = getServiceBySlug("nao-existe");
    expect(service).toBeUndefined();
  });
});
