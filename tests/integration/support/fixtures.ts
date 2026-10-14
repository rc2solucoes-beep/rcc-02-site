import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CleanupRegistry } from "./cleanup";
import type { Fixture } from "./probes";

async function insertOrThrow(service: SupabaseClient, table: string, row: Record<string, unknown>): Promise<void> {
  const { error } = await service.from(table).insert(row);
  if (error) throw new Error(`Falha ao semear ${table}: ${error.code ?? error.message}`);
}

// Todas registram o recurso ANTES de criá-lo.

export async function makePost(
  service: SupabaseClient,
  registry: CleanupRegistry,
  tag: string,
  status: "draft" | "published",
): Promise<Fixture> {
  const id = randomUUID();
  registry.track("posts", "id", id);
  await insertOrThrow(service, "posts", {
    id,
    slug: `e0a-${tag}-${id.slice(0, 8)}`,
    title: "E0a fixture",
    status,
    published_at: status === "published" ? new Date().toISOString() : null,
  });
  return { table: "posts", idColumn: "id", id };
}

export async function makeSetting(service: SupabaseClient, registry: CleanupRegistry, tag: string): Promise<Fixture> {
  const key = `__e0a_${tag}_${randomUUID().slice(0, 8)}`;
  registry.track("settings", "key", key);
  await insertOrThrow(service, "settings", { key, value: "" });
  return { table: "settings", idColumn: "key", id: key };
}

export async function makeAuthor(service: SupabaseClient, registry: CleanupRegistry, tag: string): Promise<Fixture> {
  const id = randomUUID();
  registry.track("authors", "id", id);
  await insertOrThrow(service, "authors", { id, name: `E0a author ${tag}` });
  return { table: "authors", idColumn: "id", id };
}

export async function makeLead(service: SupabaseClient, registry: CleanupRegistry, tag: string): Promise<Fixture> {
  const id = randomUUID();
  registry.track("leads", "id", id);
  await insertOrThrow(service, "leads", {
    id,
    name: "Teste E0a",
    company: "Sintético",
    email: `e0a-${tag}-${id.slice(0, 8)}@example.test`,
    whatsapp: "5500000000000",
    segment: "teste",
    size: "1",
    solution: "teste",
    message: "dado sintético da suíte E0a",
  });
  return { table: "leads", idColumn: "id", id };
}
