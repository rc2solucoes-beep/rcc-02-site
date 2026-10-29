// Verificação de origem (CSRF) para rotas públicas que recebem POST do navegador.
//
// Mesma regra de `api/contact/route.ts` (que mantém a sua cópia privada): o SDD da Newsletter
// (§5.1) só permite compartilhar o helper DEPOIS da integração da branch de tracking (DEP-07),
// que também altera a rota de contato. Quando isso acontecer, a rota de contato passa a importar
// este módulo e a cópia privada é removida.

type OriginEnv = Record<string, string | undefined>;

export function isValidOrigin(origin: string | null, env: OriginEnv = process.env): boolean {
  if (!origin) return false;
  try {
    const url = new URL(origin);
    const allowed =
      url.hostname === "rc2solucoes.com.br" ||
      url.hostname === "www.rc2solucoes.com.br" ||
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1";
    if (allowed) return true;

    if (env.VERCEL_ENV !== "preview" || !env.VERCEL_URL) return false;
    return url.hostname === new URL(`https://${env.VERCEL_URL}`).hostname;
  } catch {
    return false;
  }
}
