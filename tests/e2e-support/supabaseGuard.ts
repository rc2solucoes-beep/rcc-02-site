import type { BrowserContext } from "@playwright/test";

const SUPABASE_HOST = /(^|\.)supabase\.(co|in|net|com)$/i;

/** Decide se uma requisição do navegador a um host do Supabase deve ser bloqueada. */
export function isForeignSupabaseHost(host: string, allowedHost: string): boolean {
  const name = host.toLowerCase().split(":")[0];
  const allowed = allowedHost.toLowerCase().split(":")[0];
  if (name === allowed) return false;
  return SUPABASE_HOST.test(name);
}

/**
 * Segunda camada: aborta qualquer requisição do navegador a um Supabase que não seja o isolado e
 * registra só a ocorrência (nunca o host, que contém o ref do projeto).
 */
export async function installSupabaseGuard(context: BrowserContext, allowedHost: string, blocked: string[]): Promise<void> {
  await context.route(
    (url) => isForeignSupabaseHost(url.host, allowedHost),
    async (route) => {
      blocked.push("requisicao_a_supabase_nao_isolado");
      await route.abort("blockedbyclient");
    },
  );
}
