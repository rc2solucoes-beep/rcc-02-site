import { describe, it, expect } from "vitest";
import { contactSchema } from "@/lib/validations/contact";

const valid = {
  name: "João Silva",
  company: "Empresa LTDA",
  email: "joao@empresa.com",
  whatsapp: "11999999999",
  segment: "Varejo",
  size: "1–10 colaboradores",
  solution: "Automações com IA",
  message: "Preciso automatizar meu atendimento no WhatsApp.",
};

describe("contactSchema", () => {
  it("aceita dados válidos", () => {
    const result = contactSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejeita nome muito curto", () => {
    const result = contactSchema.safeParse({ ...valid, name: "J" });
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.name).toBeDefined();
  });

  it("rejeita e-mail inválido", () => {
    const result = contactSchema.safeParse({ ...valid, email: "nao-e-email" });
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.email).toBeDefined();
  });

  it("rejeita whatsapp curto", () => {
    const result = contactSchema.safeParse({ ...valid, whatsapp: "123" });
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.whatsapp).toBeDefined();
  });

  it("rejeita mensagem muito curta", () => {
    const result = contactSchema.safeParse({ ...valid, message: "curta" });
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.message).toBeDefined();
  });

  it("rejeita se honeypot preenchido", () => {
    const result = contactSchema.safeParse({ ...valid, website: "http://spam.com" });
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.website).toBeDefined();
  });

  it("aceita honeypot vazio", () => {
    const result = contactSchema.safeParse({ ...valid, website: "" });
    expect(result.success).toBe(true);
  });

  it("aceita turnstileToken opcional", () => {
    const result = contactSchema.safeParse({ ...valid, turnstileToken: "abc123" });
    expect(result.success).toBe(true);
  });

  it("aceita sem turnstileToken", () => {
    const result = contactSchema.safeParse({ ...valid });
    expect(result.success).toBe(true);
  });
});
