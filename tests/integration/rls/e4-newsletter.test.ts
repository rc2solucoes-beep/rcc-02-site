import { createHash, randomBytes, randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createRoleClients, type RoleClients } from "../support/clients";
import { runTeardownPhases } from "../support/cleanup";
import { describeError } from "../support/errors";

// T-NL-I16/I17: chama as RPCs N4 com JWTs REAIS de usuários sintéticos.
// Sem RC2_E4_PHASE=post020, suite não executa. globalSetup + createRoleClients
// validam projeto, allowlist, anti-produção e marcador ANTES de gerar dados.
// Nunca envia e-mail, aplica SQL, ou habilita flags. Requer chaves EXCLUSIVAS de teste.
const run = process.env.RC2_E4_PHASE === "post020";
const uuid = randomUUID;
const confirmation = () => "nlt_" + randomBytes(32).toString("base64url");
const hash = (value: string) => createHash("sha256").update(value).digest("hex");

describe.skipIf(!run)("E4 / N4 — JWT real, descadastro e exclusão (isolado)", () => {
  let clients: RoleClients | undefined;
  const subscriberId = uuid();
  const outboxId = uuid();
  const tag = uuid().slice(0, 8);

  function c(): RoleClients {
    if (!clients) throw new Error("E4: clientes de teste não inicializados");
    return clients;
  }
  function svc(): SupabaseClient { return c().service; }

  async function getOne(table: string, cols: string, column: string, value: string) {
    const { data, error } = await svc().from(table).select(cols).eq(column, value);
    expect(error?.code ?? null).toBe(null);
    // A tabela é dinâmica nesta inspeção. O client Supabase infere GenericStringError
    // sem schema estático; depois de checar error, tratamos linhas como registros.
    return (data ?? []) as unknown as Array<Record<string, unknown>>;
  }
  async function assertOk(promise: PromiseLike<{ error: { code?: string } | null }>, label: string): Promise<void> {
    const { error } = await promise;
    if (error) throw new Error(`E4 setup ${label}: ${error.code ?? "db_error"}`);
  }

  beforeAll(async () => {
    clients = await createRoleClients();
    // Todos os IDs são conhecidos ANTES da primeira escrita e removidos no afterAll.
    const email = `e4-${tag}@example.test`;
    const token = confirmation();
    const unsubscribeToken = confirmation();
    await assertOk(svc().from("newsletter_subscribers").insert({
      id: subscriberId, email, email_normalized: email, status: "pending",
    }), "subscriber");
    await assertOk(svc().from("newsletter_outbox").insert({
      id: outboxId, subscriber_id: subscriberId, kind: "confirmation", status: "queued",
      consent_text_version: "e4-synthetic", policy_version: "e4-synthetic",
    }), "outbox");
    await assertOk(svc().from("newsletter_tokens").insert({
      subscriber_id: subscriberId, outbox_id: outboxId, kind: "confirm",
      token_hash: hash(token), expires_at: new Date(Date.now() + 3600000).toISOString(),
      consent_text_version: "e4-synthetic", policy_version: "e4-synthetic",
    }), "token");
    await assertOk(svc().from("newsletter_outbox_payload").insert({
      outbox_id: outboxId, confirm_token: token, unsubscribe_token: unsubscribeToken,
      template_version: "e4-synthetic",
    }), "payload");
    await assertOk(svc().from("newsletter_consents").insert({
      subscriber_id: subscriberId, event: "consent_requested",
      consent_text_version: "e4-synthetic", policy_version: "e4-synthetic",
    }), "consent");
  }, 120000);

  afterAll(async () => {
    if (!clients) return;
    const current = clients;
    const failures = await runTeardownPhases([
      {
        name: "assinante sintético e cascatas",
        run: async () => {
          const { error } = await current.service.from("newsletter_subscribers").delete().eq("id", subscriberId);
          return error ? ["subscriber cleanup: " + describeError(error)] : [];
        },
      },
      {
        name: "auditorias sintéticas N4",
        run: async () => {
          const { error } = await current.service.from("admin_audit_logs").delete()
            .eq("resource_type", "newsletter_subscriber").eq("resource_id", subscriberId)
            .in("event", ["admin_newsletter_unsubscribed", "admin_newsletter_deleted"]);
          return error ? ["audit cleanup: " + describeError(error)] : [];
        },
      },
      {
        name: "inspeção de resíduos N4",
        run: async () => {
          const problems: string[] = [];
          for (const [table, col, id] of [
            ["newsletter_subscribers", "id", subscriberId],
            ["newsletter_outbox", "id", outboxId],
            ["newsletter_outbox_payload", "outbox_id", outboxId],
            ["newsletter_consents", "subscriber_id", subscriberId],
            ["newsletter_tokens", "subscriber_id", subscriberId],
            ["admin_audit_logs", "resource_id", subscriberId],
          ]) {
            const { data, error } = await current.service.from(table).select(col).eq(col, id);
            if (error || (data?.length ?? 0) !== 0) problems.push(table + " residue/check failed");
          }
          return problems;
        },
      },
      { name: "identidades sintéticas", run: () => current.cleanup() },
    ]);
    expect(failures).toEqual([]);
  }, 120000);

  it("anon não tem EXECUTE e usuário não-admin recebe 42501 sem mutação", async () => {
    for (const action of ["newsletter_admin_unsubscribe", "newsletter_admin_delete_subscriber"] as const) {
      const args = action === "newsletter_admin_unsubscribe"
        ? { p_subscriber_id: subscriberId, p_reason: "titular_request" }
        : { p_subscriber_id: subscriberId, p_confirmation: "EXCLUIR" };
      const anonymous = await c().anon.rpc(action, args);
      expect(anonymous.error).not.toBeNull();
      const nonAdmin = await c().nonAdmin.rpc(action, args);
      expect(nonAdmin.error?.code).toBe("42501");
    }
    const row = await getOne("newsletter_subscribers", "id,status", "id", subscriberId);
    expect(row).toHaveLength(1);
    expect(row[0].status).toBe("pending");
    expect(await getOne("admin_audit_logs", "id", "resource_id", subscriberId)).toHaveLength(0);
  });

  it("admin descadastra e revoga confirmação e payload, com auditoria transacional", async () => {
    const response = await c().admin.rpc("newsletter_admin_unsubscribe", {
      p_subscriber_id: subscriberId, p_reason: "titular_request",
    });
    expect(response.error?.code ?? null).toBe(null);
    expect(response.data).toBe("unsubscribed");

    const sub = await getOne("newsletter_subscribers", "status,unsubscribed_at", "id", subscriberId);
    expect(sub).toHaveLength(1);
    expect(sub[0].status).toBe("unsubscribed");
    expect(sub[0].unsubscribed_at).toBeTruthy();

    const outbox = await getOne("newsletter_outbox", "status,dead_reason", "id", outboxId);
    expect(outbox).toHaveLength(1);
    expect(outbox[0]).toMatchObject({ status: "dead", dead_reason: "superseded" });
    expect(await getOne("newsletter_outbox_payload", "outbox_id", "outbox_id", outboxId)).toHaveLength(0);
    expect(await getOne("newsletter_tokens", "id", "subscriber_id", subscriberId)).toHaveLength(0);
    const consents = await getOne("newsletter_consents", "event,reason", "subscriber_id", subscriberId);
    expect(consents.filter(x => x.event === "unsubscribed_admin")).toEqual([
      expect.objectContaining({ reason: "titular_request" }),
    ]);
    const audits = await getOne("admin_audit_logs", "event,actor_user_id,resource_id", "resource_id", subscriberId);
    expect(audits.filter(x => x.event === "admin_newsletter_unsubscribed")).toEqual([
      expect.objectContaining({ actor_user_id: c().adminUserId }),
    ]);
  });

  it("repetição é idempotente e exclusão exige confirmação literal", async () => {
    const again = await c().admin.rpc("newsletter_admin_unsubscribe", {
      p_subscriber_id: subscriberId, p_reason: "other",
    });
    expect(again.error).toBeNull();
    expect(again.data).toBe("already_unsubscribed");
    const bad = await c().admin.rpc("newsletter_admin_delete_subscriber", {
      p_subscriber_id: subscriberId, p_confirmation: "excluir",
    });
    expect(bad.error).toBeNull();
    expect(bad.data).toBe("confirmation_invalid");
    const consents = await getOne("newsletter_consents", "event", "subscriber_id", subscriberId);
    expect(consents.filter(x => x.event === "unsubscribed_admin")).toHaveLength(1);
    const audits = await getOne("admin_audit_logs", "event", "resource_id", subscriberId);
    expect(audits.filter(x => x.event === "admin_newsletter_unsubscribed")).toHaveLength(1);
  });

  it("admin exclui com CASCADE e preserva auditoria, reexecução retorna not_found", async () => {
    const deleted = await c().admin.rpc("newsletter_admin_delete_subscriber", {
      p_subscriber_id: subscriberId, p_confirmation: "EXCLUIR",
    });
    expect(deleted.error).toBeNull();
    expect(deleted.data).toBe("deleted");
    expect(await getOne("newsletter_subscribers", "id", "id", subscriberId)).toHaveLength(0);
    expect(await getOne("newsletter_outbox", "id", "id", outboxId)).toHaveLength(0);
    expect(await getOne("newsletter_consents", "id", "subscriber_id", subscriberId)).toHaveLength(0);
    const audits = await getOne("admin_audit_logs", "event,actor_user_id", "resource_id", subscriberId);
    expect(audits.filter(x => x.event === "admin_newsletter_deleted")).toEqual([
      expect.objectContaining({ actor_user_id: c().adminUserId }),
    ]);
    const again = await c().admin.rpc("newsletter_admin_delete_subscriber", {
      p_subscriber_id: subscriberId, p_confirmation: "EXCLUIR",
    });
    expect(again.error).toBeNull();
    expect(again.data).toBe("not_found");
  });
});
