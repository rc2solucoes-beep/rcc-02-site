import { test, expect } from "@playwright/test";

/**
 * Fase 6F — migração das URLs de território Zapbox para a ponte (docs/22).
 *
 * O status do redirect é medido por HTTP, não por navegação: o navegador segue
 * a cadeia e esconderia justamente o que precisa ser verificado — o código e o
 * número de saltos.
 *
 * A forma canônica (sem barra final) é a indexada e a linkada, e é ela que
 * precisa custar **um** salto. Com barra final, a normalização do framework
 * roda antes de `redirects()` e acrescenta um salto próprio
 * (`TRAILING_SLASH_NORMALIZATION_HOP`, docs/22 §2.1) — comportamento
 * pré-existente, fora do contrato desta unidade.
 */

const MIGRATED = [
  "/servicos/automacoes-com-ia",
  "/solucoes/atendimento-lento",
  "/solucoes/leads-sem-resposta",
  "/solucoes/whatsapp-desorganizado",
  "/servicos/automacao-de-atendimento",
] as const;

/** SPLIT_INTENT, hub, KEEP e NEEDS_SEO_DATA — nenhuma migra nesta unidade. */
/**
 * As três URLs de `/servicos` saíram desta lista na Fase 3 (`docs/24`), que as
 * consolidou em `/solucoes`. O contrato delas vive em `services.spec.ts`.
 * O que resta aqui é o que nenhuma fase decidiu ainda.
 */
/**
 * Vazio: `/solucoes-com-ia` era a última URL que a 6F preservava sem destino
 * decidido. O `SPLIT_INTENT` foi encerrado — ela passou a redirecionar para
 * `/solucoes` e saiu do sitemap.
 */
const PRESERVED: readonly string[] = [];

test.describe("Migração Zapbox — contrato de redirect", () => {
  for (const source of MIGRATED) {
    test(`${source} responde 308 para a ponte`, async ({ request }) => {
      const response = await request.get(source, { maxRedirects: 0 });

      expect(response.status()).toBe(308);
      expect(response.headers()["location"]).toMatch(/\/zapbox$/);
    });

    test(`${source} chega à ponte em um salto`, async ({ request }) => {
      // Um salto é provado seguindo a cadeia manualmente: o destino do 308
      // precisa responder 200 direto, sem um segundo redirect no meio.
      const first = await request.get(source, { maxRedirects: 0 });
      const location = first.headers()["location"];

      const second = await request.get(location, { maxRedirects: 0 });
      expect(second.status()).toBe(200);

      const final = await request.get(source);
      expect(final.status()).toBe(200);
      expect(new URL(final.url()).pathname).toBe("/zapbox");
    });
  }

  test("o alias não passa pelo slug antigo", async ({ request }) => {
    const response = await request.get("/servicos/automacao-de-atendimento", {
      maxRedirects: 0,
    });

    expect(response.headers()["location"]).not.toContain("automacoes-com-ia");
  });
});

test.describe("Migração Zapbox — o que permanece", () => {
  for (const path of PRESERVED) {
    test(`${path} continua 200 e não cai na ponte`, async ({ request }) => {
      const response = await request.get(path);

      expect(response.status()).toBe(200);
      expect(new URL(response.url()).pathname).toBe(path);
    });
  }

  test("a ponte continua 200 e não redireciona para fora", async ({
    request,
  }) => {
    const response = await request.get("/zapbox", { maxRedirects: 0 });

    expect(response.status()).toBe(200);
  });
});

test.describe("Migração Zapbox — destino renderizado", () => {
  test("uma source migrada leva à ponte, com o H1 da ponte", async ({
    page,
  }) => {
    await page.goto("/solucoes/whatsapp-desorganizado");

    await expect(page).toHaveURL(/\/zapbox$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      /Quando o problema é o WhatsApp/
    );
  });

  test("o sitemap não publica nenhuma source migrada", async ({ request }) => {
    const xml = await (await request.get("/sitemap.xml")).text();

    for (const source of MIGRATED) {
      expect(xml).not.toContain(`<loc>https://www.rc2solucoes.com.br${source}</loc>`);
    }
    expect(xml).toContain("<loc>https://www.rc2solucoes.com.br/zapbox</loc>");
    for (const path of PRESERVED) {
      expect(xml).toContain(`<loc>https://www.rc2solucoes.com.br${path}</loc>`);
    }
  });
});
