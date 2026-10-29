import { afterAll, beforeAll } from "vitest";
import { createRoleClients, type RoleClients } from "../support/clients";
import { HarnessError, describeError } from "../support/errors";
import { getVerifiedTarget } from "../support/target";
import { SupabaseBackend } from "../../lc01/supabaseBackend";
import { defineLc01Scenarios } from "../../lc01/scenarios";

// LC-01 (SDD Newsletter §8.9) contra o Supabase ISOLADO, com as RPCs reais da migration 018 e o
// ResendProvider REAL apontado para o simulador em loopback (sem e-mail real). ESCRITO, NÃO EXECUTADO.
//
// Cobre o processador + a fila. NÃO cobre o salto pg_cron → pg_net → Vercel: isso é a etapa B do
// LC-01 (docs/runbooks/migrations/019-newsletter-dispatch/README.md), que exige a N2 e a instalação
// do pg_net, ambas com autorização específica.
//
// ATIVAÇÃO EXPLÍCITA: RC2_RUN_LC01=1. Exige o projeto pyhhygvdjokddphftuua, recusa produção,
// detecta a 018 ausente (sem aplicar nada) e recusa rodar com itens abertos no outbox que não sejam
// seus (o claim e o expire são globais). Remove só os assinantes sintéticos que criou.

const ENABLED = process.env.RC2_RUN_LC01 === "1";
const EXPECTED_REF = "pyhhygvdjokddphftuua";
const PRODUCTION_REF = "ymfcepzwhiemgkxzmbdm";

let clients: RoleClients | undefined;

beforeAll(async () => {
  if (!ENABLED) return;
  const target = getVerifiedTarget();
  if (target.projectRef === PRODUCTION_REF) throw new HarnessError("RECUSADO: o alvo é o projeto de PRODUÇÃO.");
  if (target.projectRef !== EXPECTED_REF) throw new HarnessError(`RECUSADO: o LC-01 só roda no projeto isolado ${EXPECTED_REF}.`);
  clients = await createRoleClients();

  const probe = await clients.service.from("newsletter_outbox").select("id", { head: true, count: "exact" });
  if (probe.error) {
    throw new HarnessError(`A migration 018 não está aplicada no isolado. Este teste não aplica migrations. Detalhe: ${describeError(probe.error)}`);
  }
  const open = await clients.service.from("newsletter_outbox").select("id").in("status", ["queued", "retry", "sending"]);
  if (open.error) throw new HarnessError(`Falha ao inspecionar o outbox: ${describeError(open.error)}`);
  if ((open.data ?? []).length > 0) {
    throw new HarnessError(`O outbox do isolado tem ${(open.data ?? []).length} item(ns) em aberto: o LC-01 recusa rodar para não reivindicar nem expirar itens que não são dele.`);
  }
});

afterAll(async () => {
  const problems = clients ? await clients.cleanup() : [];
  if (problems.length > 0) throw new Error(`Falha de limpeza dos usuários sintéticos: ${problems.join(" | ")}`);
});

defineLc01Scenarios(
  "Supabase isolado (RPCs reais da 018)",
  async () => {
    if (!clients) throw new HarnessError("clientes não inicializados");
    return new SupabaseBackend(clients.service, clients.tag);
  },
  { enabled: ENABLED },
);
