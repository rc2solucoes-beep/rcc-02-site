import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { loadTestEnvFile } from "./env";
import { IntegrationGuardError } from "./guard";
import { getVerifiedTarget, type VerifiedTarget } from "./target";

// ÚNICO arquivo da suíte que chama createClient (verificado por teste estático).
const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } } as const;

export const TEST_ENV_MARKER_KEY = "__rc2_isolated_test_env__";

export type RoleClients = {
  tag: string;
  anon: SupabaseClient;
  nonAdmin: SupabaseClient;
  admin: SupabaseClient;
  /**
   * Getter que revalida o alvo a cada acesso E devolve um proxy que revalida a
   * cada chamada de método: guardar a referência não permite reutilizar o
   * cliente privilegiado depois que o ambiente deixar de ser seguro.
   */
  readonly service: SupabaseClient;
  adminUserId: string;
  nonAdminUserId: string;
  /** Remove os usuários sintéticos e devolve as falhas. Lista vazia = limpo e verificado. */
  cleanup(): Promise<string[]>;
};

// Envolve o cliente: toda chamada de método (inclusive em objetos aninhados,
// como auth.admin) executa `validate()` antes de delegar ao cliente real.
function guarded<T extends object>(target: T, validate: () => void): T {
  return new Proxy(target, {
    get(obj, prop) {
      const value = Reflect.get(obj, prop, obj) as unknown;
      if (typeof value === "function") {
        return (...args: unknown[]) => {
          validate();
          return (value as (...a: unknown[]) => unknown).apply(obj, args);
        };
      }
      if (value !== null && typeof value === "object") return guarded(value as object, validate);
      return value;
    },
  });
}

// O ambiente precisa se declarar de teste: uma linha pública em settings cujo
// valor é o ref do projeto de teste. Só leitura, com a chave anon, e só depois
// de a guarda estática aceitar o alvo.
async function assertIsolatedMarker(anon: SupabaseClient, target: VerifiedTarget): Promise<void> {
  const { data, error } = await anon.from("settings").select("value").eq("key", TEST_ENV_MARKER_KEY);
  const rows = (data as Array<{ value?: unknown }> | null) ?? [];
  if (error || rows.length !== 1 || rows[0].value !== target.projectRef) {
    throw new IntegrationGuardError("missing_marker");
  }
}

export async function createRoleClients(): Promise<RoleClients> {
  loadTestEnvFile();
  const target = getVerifiedTarget(); // 1) guarda estática, antes de qualquer cliente

  const anon = createClient(target.url, target.anonKey, clientOptions);
  await assertIsolatedMarker(anon, target); // 2) o ambiente se declara de teste

  // 3) só agora o service_role existe, e nunca é exposto sem o proxy que revalida.
  const serviceClient = guarded(
    createClient(target.url, target.serviceKey, clientOptions),
    () => {
      getVerifiedTarget();
    },
  );
  const svc = (): SupabaseClient => serviceClient;

  const tag = randomUUID().slice(0, 8);
  const password = `${randomUUID()}Aa1!`;
  const createdUserIds: string[] = [];

  async function makeUser(label: "admin" | "member") {
    const email = `e0a-${tag}-${label}@example.test`;
    const created = await svc().auth.admin.createUser({ email, password, email_confirm: true });
    if (created.error || !created.data.user) {
      throw new Error(`Falha ao criar o usuário sintético (${label}): ${created.error?.message}`);
    }
    createdUserIds.push(created.data.user.id); // registrado imediatamente

    const client = createClient(target.url, target.anonKey, clientOptions);
    const signedIn = await client.auth.signInWithPassword({ email, password });
    if (signedIn.error) {
      throw new Error(`Falha ao autenticar o usuário sintético (${label}): ${signedIn.error.message}`);
    }
    return { client, id: created.data.user.id, email };
  }

  async function cleanup(): Promise<string[]> {
    const failures: string[] = [];
    for (const id of createdUserIds) {
      const removedAdmin = await svc().from("admin_users").delete().eq("id", id);
      if (removedAdmin.error) {
        failures.push(`admin_users ${id.slice(0, 8)}: ${removedAdmin.error.code ?? removedAdmin.error.message}`);
      }
      const removedUser = await svc().auth.admin.deleteUser(id);
      if (removedUser.error) failures.push(`auth.users ${id.slice(0, 8)}: ${removedUser.error.message}`);
    }
    // Inspeção final (projeto de teste pequeno; uma página de 1000 usuários basta).
    const listed = await svc().auth.admin.listUsers({ perPage: 1000 });
    if (listed.error) {
      failures.push(`inspeção de usuários falhou: ${listed.error.message}`);
    } else {
      for (const user of listed.data.users) {
        if (user.email?.startsWith(`e0a-${tag}-`)) failures.push(`usuário sintético remanescente ${user.id.slice(0, 8)}`);
      }
    }
    return failures;
  }

  try {
    const admin = await makeUser("admin");
    const member = await makeUser("member");

    const registered = await svc().from("admin_users").insert({ id: admin.id, email: admin.email });
    if (registered.error) {
      throw new Error(`Falha ao registrar o admin sintético: ${registered.error.message}`);
    }

    return {
      tag,
      anon,
      nonAdmin: member.client,
      admin: admin.client,
      get service() {
        getVerifiedTarget(); // revalida também no acesso
        return svc();
      },
      adminUserId: admin.id,
      nonAdminUserId: member.id,
      cleanup,
    };
  } catch (error) {
    // Falha parcial de setup: limpa o que existir e nunca silencia a falha de limpeza.
    const failures = await cleanup();
    if (failures.length > 0) {
      throw new AggregateError(
        [error, new Error(`Falha de limpeza: ${failures.join(" | ")}`)],
        "O setup falhou e a limpeza também",
      );
    }
    throw error;
  }
}
