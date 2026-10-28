import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const root = resolve(process.cwd());
const read = (p: string) => readFileSync(resolve(root,p), "utf8");
const sql=read("supabase/migrations/020_newsletter_admin_essential.sql");
const actions=read("src/app/admin/(protected)/newsletter/actions.ts");
const page=read("src/app/admin/(protected)/newsletter/[id]/page.tsx");
describe("E4 N4 — contrato estático de segurança",()=>{
  it("a migration N4 tem primeira aplicação estrita e transação única",()=>{
    expect(sql).toMatch(/^BEGIN;$/m);
    expect(sql).toMatch(/^COMMIT;$/m);
    expect(sql.replace(/^--.*$/gm, "")).not.toMatch(/\bIF NOT EXISTS\b/i);
    expect(sql).toContain("role newsletter_ops já existe");
  });
  it("dedica role sem login, superuser ou BYPASSRLS; sem proprietário postgres",()=>{
    expect(sql).toMatch(/CREATE ROLE newsletter_ops NOLOGIN NOINHERIT NOSUPERUSER.*NOBYPASSRLS/);
    expect(sql).toContain("OWNER TO newsletter_ops");
    expect(sql).toContain("REVOKE newsletter_ops FROM postgres");
    expect(sql).not.toMatch(/OWNER TO postgres/);
  });
  it("definer com autorização JWT/admin explícita, search_path fixo e audit atômico",()=>{
    expect((sql.match(/SECURITY DEFINER/g)||[]).length).toBe(2);
    expect((sql.match(/SET search_path = pg_catalog, public/g)||[]).length).toBe(2);
    expect((sql.match(/IF v_actor IS NULL OR NOT EXISTS \(SELECT 1 FROM public.admin_users WHERE id = v_actor\)/g)||[]).length).toBe(2);
    expect(sql).toContain("admin_newsletter_unsubscribed");
    expect(sql).toContain("admin_newsletter_deleted");
    expect(sql).toContain("RAISE EXCEPTION 'acesso negado'");
    expect(sql).not.toMatch(/\bEXECUTE\s+[^;]*\bformat\(/i);
  });
  it("não inclui operações complementares ou acesso a token bruto",()=>{
    expect(sql).not.toContain("newsletter_admin_resend_confirmation(");
    expect(sql).not.toContain("newsletter_admin_revoke_unsubscribe_tokens(");
    expect(sql).toContain("GRANT SELECT (outbox_id), DELETE ON public.newsletter_outbox_payload TO newsletter_ops");
    expect(sql).toContain("DELETE FROM public.newsletter_outbox_payload");
    expect(sql).toContain("WHERE outbox_id IN (SELECT id FROM superseded)");
    expect(sql).not.toMatch(/GRANT SELECT, DELETE ON public\.newsletter_outbox_payload TO newsletter_ops/);
    expect(sql).not.toMatch(/GRANT SELECT \([^)]*(confirm_token|unsubscribe_token|template_version)/);
    expect(sql).not.toContain("leads,");
  });
  it("ações e interface bloqueadas por padrão; não usam service-role",()=>{
    expect((actions.match(/NEWSLETTER_ADMIN_MUTATIONS_ENABLED !== "true"/g)||[]).length).toBe(2);
    expect(actions).toContain("requireAdmin");
    expect(actions).toMatch(/deleteNewsletterSubscriber[\\s\\S]*?NEWSLETTER_ADMIN_MUTATIONS_ENABLED !== "true"/);
    expect(actions).toMatch(/unsubscribeNewsletterSubscriber[\\s\\S]*?NEWSLETTER_ADMIN_MUTATIONS_ENABLED !== "true"/);
    expect(actions).toContain("createSessionClient");
    expect(actions).not.toContain("createServiceClient");
    expect(page).toContain('NEWSLETTER_ADMIN_MUTATIONS_ENABLED === "true"');
  });
});
