import { randomUUID } from "node:crypto";
import { CleanupRegistry, runTeardownPhases } from "../integration/support/cleanup";
import { createRoleClients } from "../integration/support/clients";
import { describeError } from "../integration/support/errors";

// Preparação e limpeza dos dados sintéticos do E2E isolado (EX-4).
//
// `createRoleClients` reaplica a guarda anti-produção, exige o marcador de ambiente de teste e
// só então entrega o service_role (sempre revalidado). Tudo o que o E2E cria leva o prefixo
// `e0a-e2e-<tag>`; o teardown roda mesmo quando testes falham e reconcilia por prefixo os posts
// criados pela interface. Morte forçada do processo não executa o teardown: ver o runbook.

const MONTHS = ["2026-01", "2026-02", "2026-03"] as const;
export const SEED_POSTS_PER_MONTH = 15;

export default async function globalSetup(): Promise<() => Promise<void>> {
  if (process.env.RC2_E2E_ISOLATED !== "1") throw new Error("RC2_E2E_ISOLATED=1 é obrigatório para o E2E isolado.");

  const roles = await createRoleClients();
  const registry = new CleanupRegistry();
  const prefix = `e0a-e2e-${roles.tag}`;
  const service = () => roles.service;

  async function teardown(): Promise<string[]> {
    return runTeardownPhases([
      { name: "remoção dos posts semeados", run: () => registry.run(service()), evidence: () => registry.describePending() },
      {
        name: "reconciliação por prefixo (posts criados pela interface)",
        run: async () => {
          const { error } = await service().from("posts").delete().like("slug", `${prefix}-%`);
          return error ? [`remoção por prefixo falhou: ${describeError(error)}`] : [];
        },
      },
      {
        name: "inspeção de resíduos",
        run: async () => {
          const problems = await registry.inspectResidue(service());
          const { count, error } = await service()
            .from("posts")
            .select("id", { count: "exact", head: true })
            .like("slug", `${prefix}-%`);
          if (error) problems.push(`inspeção por prefixo falhou: ${describeError(error)}`);
          else if ((count ?? 0) > 0) problems.push(`posts remanescentes com o prefixo: ${count}`);
          return problems;
        },
      },
      { name: "usuários sintéticos", run: () => roles.cleanup() },
    ]);
  }

  try {
    // O prefixo e0a-<tag>- é reconciliado por roles.cleanup() (usuários e admin_users).
    const email = `e0a-${roles.tag}-e2eadmin@example.test`;
    const password = `${randomUUID()}Aa1!`;
    const created = await service().auth.admin.createUser({ email, password, email_confirm: true });
    if (created.error || !created.data.user) {
      throw new Error(`Falha ao criar o admin sintético do E2E: ${describeError(created.error)}`);
    }
    const registered = await service().from("admin_users").insert({ id: created.data.user.id, email });
    if (registered.error) throw new Error(`Falha ao registrar o admin sintético do E2E: ${describeError(registered.error)}`);

    const rows: Record<string, unknown>[] = [];
    let n = 0;
    for (const month of MONTHS) {
      for (let day = 1; day <= SEED_POSTS_PER_MONTH; day += 1) {
        n += 1;
        const id = randomUUID();
        registry.track("posts", "id", id); // registrado ANTES de criar
        const at = `${month}-${String(day).padStart(2, "0")}T12:00:00.000Z`;
        rows.push({
          id,
          slug: `${prefix}-item-${n}`,
          title: `${prefix} item ${n}`,
          status: "published",
          published_at: at,
          created_at: at,
          updated_at: at,
          summary: "Resumo sintético do E2E isolado.",
          content: "<p>Conteúdo sintético do E2E isolado, sem valor editorial.</p>",
        });
      }
    }
    const draftId = randomUUID();
    registry.track("posts", "id", draftId);
    rows.push({
      id: draftId,
      slug: `${prefix}-rascunho`,
      title: `${prefix} rascunho`,
      status: "draft",
      created_at: "2026-02-01T12:00:00.000Z",
      updated_at: "2026-02-01T12:00:00.000Z",
      summary: "Resumo sintético do rascunho do E2E.",
      content: "<p>Conteúdo sintético do rascunho do E2E isolado.</p>",
    });
    const seeded = await service().from("posts").insert(rows);
    if (seeded.error) throw new Error(`Falha ao semear posts do E2E: ${describeError(seeded.error)}`);

    process.env.RC2_E2E_PREFIX = prefix;
    process.env.RC2_E2E_ADMIN_EMAIL = email;
    process.env.RC2_E2E_ADMIN_PASSWORD = password;
    process.env.RC2_E2E_DRAFT_ID = draftId;
  } catch (error) {
    const problems = await teardown();
    const reason = error instanceof Error ? error.message : "falha de setup";
    throw new Error(problems.length > 0 ? `${reason} | Falha de limpeza (${problems.length}): ${problems.join(" | ")}` : reason);
  }

  return async () => {
    const problems = await teardown();
    if (problems.length > 0) throw new Error(`Falha de limpeza do E2E (${problems.length}): ${problems.join(" | ")}`);
  };
}
