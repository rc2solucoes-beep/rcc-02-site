import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { describeError } from "./cleanup";
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

// Páginas de listagem de usuários (paginação real; exportado para os testes).
export const USER_PAGE_SIZE = 100;
const MAX_USER_PAGES = 500;

// Envolve o cliente: toda chamada de método (inclusive em objetos aninhados,
// como auth.admin) executa `validate()` antes de delegar ao cliente real.
// O RESULTADO de cada chamada também é envolvido: os construtores de consulta do
// Supabase são "thenables" preguiçosos (from().select().eq() só dispara a
// requisição no `then`), então `then` revalida imediatamente antes do envio.
// Uma consulta construída com o alvo válido e aguardada depois de ele ser
// invalidado não gera requisição.
function guarded<T extends object>(target: T, validate: () => void): T {
  return new Proxy(target, {
    get(obj, prop) {
      const value = Reflect.get(obj, prop, obj) as unknown;
      if (typeof value === "function") {
        return (...args: unknown[]) => {
          validate();
          const result = (value as (...a: unknown[]) => unknown).apply(obj, args);
          return result !== null && typeof result === "object" ? guarded(result as object, validate) : result;
        };
      }
      if (value !== null && typeof value === "object") return guarded(value as object, validate);
      return value;
    },
  });
}

// Vínculo com o alvo ORIGINAL: o ambiente atual precisa continuar seguro E ser
// exatamente o projeto e as credenciais com que o cliente foi criado. Trocar A
// por outro alvo válido B invalida a referência criada para A. Não compara nem
// imprime chaves em mensagens: o erro carrega só o motivo.
function assertSameTarget(original: VerifiedTarget): void {
  const current = getVerifiedTarget();
  if (
    current.url !== original.url ||
    current.projectRef !== original.projectRef ||
    current.anonKey !== original.anonKey ||
    current.serviceKey !== original.serviceKey
  ) {
    throw new IntegrationGuardError("target_changed");
  }
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
    () => assertSameTarget(target),
  );
  const svc = (): SupabaseClient => serviceClient;

  const tag = randomUUID().slice(0, 8);
  const password = `${randomUUID()}Aa1!`;
  const createdUserIds: string[] = [];
  // Identidades sintéticas REGISTRADAS ANTES de criar: uma resposta perdida
  // (criação feita no Supabase, resposta não recebida) não deixa órfão sem dono.
  const intendedEmails: string[] = [];
  const emailPrefix = `e0a-${tag}-`;

  async function makeUser(label: "admin" | "member") {
    const email = `${emailPrefix}${label}@example.test`;
    intendedEmails.push(email); // registrado ANTES de chamar a API
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

  // Lista (com paginação) os usuários desta execução, identificados pelo prefixo.
  async function listOwnUsers(failures: string[], phase: string): Promise<Array<{ id: string; email: string }>> {
    const found: Array<{ id: string; email: string }> = [];
    for (let page = 1; page <= MAX_USER_PAGES; page++) {
      const listed = await svc().auth.admin.listUsers({ page, perPage: USER_PAGE_SIZE });
      if (listed.error) {
        failures.push(`${phase}: listagem de usuários falhou na página ${page}: ${listed.error.message}`);
        return found;
      }
      const users = listed.data?.users ?? [];
      for (const user of users) {
        if (user.email?.startsWith(emailPrefix)) found.push({ id: user.id, email: user.email });
      }
      if (users.length < USER_PAGE_SIZE) return found;
    }
    failures.push(`${phase}: limite de ${MAX_USER_PAGES} páginas excedido; inspeção incompleta`);
    return found;
  }

  async function removeUser(id: string, failures: string[]): Promise<void> {
    try {
      const removedAdmin = await svc().from("admin_users").delete().eq("id", id);
      if (removedAdmin.error) {
        failures.push(`admin_users ${id.slice(0, 8)}: ${removedAdmin.error.code ?? removedAdmin.error.message}`);
      }
    } catch (thrown) {
      failures.push(`admin_users ${id.slice(0, 8)}: exceção ${describeError(thrown)}`);
    }
    try {
      const removedUser = await svc().auth.admin.deleteUser(id);
      if (removedUser.error) failures.push(`auth.users ${id.slice(0, 8)}: ${removedUser.error.message}`);
    } catch (thrown) {
      failures.push(`auth.users ${id.slice(0, 8)}: exceção ${describeError(thrown)}`);
    }
  }

  // Nunca lança: tenta todas as etapas e devolve tudo o que falhou. Lista vazia =
  // removido E confirmado por uma nova listagem paginada.
  async function cleanup(): Promise<string[]> {
    const failures: string[] = [];

    // 1) IDs conhecidos.
    for (const id of createdUserIds) await removeUser(id, failures);

    // 2) Reconciliação por prefixo (cobre criação com resposta perdida).
    try {
      const orphans = await listOwnUsers(failures, "reconciliação");
      for (const orphan of orphans) {
        if (!createdUserIds.includes(orphan.id)) await removeUser(orphan.id, failures);
      }
    } catch (thrown) {
      failures.push(`reconciliação lançou exceção: ${describeError(thrown)}`);
    }

    // 3) Inspeção final paginada: nada do que é desta execução pode restar.
    try {
      for (const user of await listOwnUsers(failures, "inspeção")) {
        failures.push(`usuário sintético remanescente ${user.id.slice(0, 8)}`);
      }
    } catch (thrown) {
      failures.push(`inspeção lançou exceção: ${describeError(thrown)}`);
    }

    if (failures.length > 0) {
      failures.push(
        `evidência: identidades registradas = [${intendedEmails.join(", ")}]; ids conhecidos = [${createdUserIds.join(", ")}]`,
      );
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
        assertSameTarget(target); // revalida (e confere a identidade) também no acesso
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
