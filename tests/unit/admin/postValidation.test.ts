import { describe, expect, it } from "vitest";
import { CreatePostSchema } from "@/lib/validations/post";

// Payload mínimo válido para publicar um post.
const basePublish = {
  title: "Como automatizar processos internos da sua empresa",
  slug: "como-automatizar-processos-internos",
  summary: "Um guia completo sobre automação de processos internos para PMEs.",
  content: "<p>" + "Conteúdo do artigo com bastante texto. ".repeat(20) + "</p>",
  status: "published" as const,
};

describe("CreatePostSchema — datas datetime-local", () => {
  it("publica com apenas os campos obrigatórios", () => {
    const parsed = CreatePostSchema.safeParse({ ...basePublish });
    expect(parsed.success).toBe(true);
  });

  it("aceita scheduled_publish_at no formato de <input type=datetime-local>", () => {
    // Um input datetime-local emite "YYYY-MM-DDTHH:mm" (sem segundos nem fuso).
    const parsed = CreatePostSchema.safeParse({
      ...basePublish,
      status: "scheduled",
      scheduled_publish_at: "2026-08-01T10:00",
    });
    expect(parsed.success).toBe(true);
  });

  it("aceita published_at e updated_at no formato datetime-local", () => {
    const parsed = CreatePostSchema.safeParse({
      ...basePublish,
      published_at: "2026-07-24T10:00",
      updated_at: "2026-07-24T11:30",
    });
    expect(parsed.success).toBe(true);
  });

  it("mantém null quando a data está vazia", () => {
    const parsed = CreatePostSchema.safeParse({
      ...basePublish,
      scheduled_publish_at: null,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.scheduled_publish_at ?? null).toBeNull();
    }
  });
});
