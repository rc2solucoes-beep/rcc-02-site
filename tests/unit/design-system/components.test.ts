import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Fase 5 — componentes formalizados do design system.
 *
 * A direção de arte (§8) pede que Numerado e Stat/Counter sejam componentes
 * reutilizáveis, não implementações ad-hoc por página. Estes contratos
 * protegem as regras que o próprio documento enuncia — especialmente as duas
 * que já haviam sido violadas na implementação anterior: numeral em laranja e
 * motion sem saída para `prefers-reduced-motion`.
 */
const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf-8");

/**
 * Fonte sem comentários. Vários contratos aqui afirmam a AUSÊNCIA de um
 * padrão; sem isso, o comentário que explica por que o padrão foi removido faz
 * o próprio contrato falhar.
 */
const readCode = (rel: string) =>
  read(rel)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

const UI = "src/components/ui";

describe("Design system — componentes existem como fonte única", () => {
  it.each([
    "NumberedList.tsx",
    "StatCounter.tsx",
    "SignalList.tsx",
    "FaqList.tsx",
    "ShareRow.tsx",
    "AuthorByline.tsx",
  ])("%s vive em components/ui", (file) => {
    expect(existsSync(join(root, UI, file))).toBe(true);
  });

  it("o StepList ad-hoc não voltou a existir", () => {
    expect(existsSync(join(root, "src/components/marketing/StepList.tsx"))).toBe(
      false
    );
  });
});

describe("Numerado — o numeral nunca é Safety Orange", () => {
  /**
   * §11 Do/Don't: "Numeral outline navy/muted" ✅ contra "Numeral em Safety
   * Orange sólido" ❌. O `StepList` anterior usava `--rc2-brand-text/20`.
   */
  it("o componente não pinta o numeral com a cor de marca", () => {
    const body = read(`${UI}/NumberedList.tsx`);
    expect(body).toContain("text-rc2-text-muted");
    expect(body).not.toMatch(/text-rc2-brand(?!-)/);
  });

  it("nenhuma página pinta numeral de seção com a cor de marca", () => {
    for (const file of [
      "src/components/marketing/home/HomeMethod.tsx",
      "src/components/marketing/home/HomeCompetencies.tsx",
      "src/components/marketing/solucoes/SolutionsCompetencies.tsx",
    ]) {
      const body = read(file);
      // O numeral é o `rc2-label` que envolve `padStart(2, "0")`.
      const numerals = [...body.matchAll(/<span className="([^"]*rc2-label[^"]*)"[^>]*>\s*\{String\(index/g)];
      for (const [, classes] of numerals) {
        expect(classes).not.toContain("text-rc2-brand");
      }
    }
  });
});

describe("Stat/Counter — motion que representa mudança real", () => {
  const body = read(`${UI}/StatCounter.tsx`);

  it("conta uma vez ao entrar na viewport, sem loop", () => {
    expect(body).toContain("IntersectionObserver");
    expect(body).toContain("observer.disconnect()");
    expect(body).not.toContain("setInterval");
  });

  it("respeita prefers-reduced-motion caindo no valor final", () => {
    expect(body).toContain("prefers-reduced-motion");
  });

  it("aplica Safety Orange só ao completar a contagem", () => {
    // A cor entra atrelada a `done` — o instante em que o estado muda.
    expect(body).toMatch(/done\s*\?\s*"text-rc2-brand"/);
  });

  it("expõe o valor final a leitor de tela durante a contagem", () => {
    expect(body).toContain("aria-label");
  });
});

describe("Gesto cinético — o H1 aprovado sobrevive sem JS", () => {
  const body = read("src/components/marketing/home/KineticHeadline.tsx");

  it("renderiza a palavra aprovada no estado inicial", () => {
    expect(body).toContain("useState(word)");
  });

  it("a sequência termina na palavra aprovada", () => {
    expect(body).toContain("[...alternates, word]");
  });

  it("respeita prefers-reduced-motion não animando", () => {
    expect(body).toContain("prefers-reduced-motion");
  });

  it("a frase completa chega ao leitor de tela por aria-label", () => {
    expect(body).toContain("aria-label={fullText}");
  });
});

describe("Gesto cinético — a lista de palavras é aprovada", () => {
  it("usa exatamente as palavras aprovadas, terminando na do H1", async () => {
    const { HOME_HERO_KINETIC, HOME_COPY } = await import("@/lib/content/home");

    // Aprovadas em 03/09/2026, fechando a decisão que a §12 deixava aberta.
    expect(HOME_HERO_KINETIC.alternates).toEqual(["sistemas", "planilhas"]);
    expect(HOME_HERO_KINETIC.copyApproved).toBe(true);

    // A palavra final tem de existir no H1 aprovado: é dele que o componente
    // fatia prefixo e sufixo. Se a copy do H1 mudar, isto falha alto.
    expect(HOME_COPY.h1).toContain(HOME_HERO_KINETIC.word);
  });

  it("nenhuma palavra provisória vaza para a copy do H1", async () => {
    const { HOME_HERO_KINETIC, HOME_COPY } = await import("@/lib/content/home");
    for (const alternate of HOME_HERO_KINETIC.alternates) {
      expect(HOME_COPY.h1).not.toContain(alternate);
    }
  });
});

describe("Hero — o módulo diagramático saiu", () => {
  it("o componente do diagrama não existe mais", () => {
    expect(
      existsSync(join(root, "src/components/marketing/home/HomeHeroDiagram.tsx"))
    ).toBe(false);
  });

  it("a Home não referencia diagrama nem fluxograma no hero", () => {
    const home = read("src/app/(public)/page.tsx");
    expect(home).not.toContain("HomeHeroDiagram");
  });

  it("o hero usa o ritmo de seção de assinatura", () => {
    const home = read("src/app/(public)/page.tsx");
    expect(home).toContain("rc2-section--signature");
  });
});

describe("Barra de progresso do Contato — comunica a etapa de fato", () => {
  const body = readCode("src/components/marketing/ContactForm.tsx");

  /**
   * O trilho usava `step >= 1` com `step: 1 | 2` — sempre verdadeiro. A barra
   * ficava cheia desde a etapa 1 e nunca dizia onde a pessoa estava. Um teste
   * de comportamento normal não pegaria: o valor "funcionava", só não
   * significava nada.
   */
  it("não decide o preenchimento por uma condição sempre verdadeira", () => {
    expect(body).not.toContain("step >= 1");
  });

  it("o preenchimento é proporcional à etapa", () => {
    expect(body).toContain("(step / TOTAL_STEPS) * 100");
    expect(body).toContain("width: `${percent}%`");
  });

  it("expõe o progresso a tecnologia assistiva", () => {
    expect(body).toContain('role="progressbar"');
    expect(body).toContain("aria-valuenow={step}");
    expect(body).toContain("aria-valuemax={TOTAL_STEPS}");
  });

  it("avança com transição suave e respeita reduced-motion", () => {
    expect(body).toContain("transition-[width]");
    expect(body).toContain("motion-reduce:transition-none");
  });
});

describe("Acabamentos da §8", () => {
  it("os dois blocos de lista usam ícone, no mesmo traço", () => {
    const body = readCode(`${UI}/SignalList.tsx`);
    // O sinal era um `Circle` de 7px — bullet disfarçado de ícone.
    expect(body).not.toContain("size={7}");
    expect(body).toContain("AlertCircle");
    expect(body).toContain("CheckCircle2");
    // Desde a §6 atualizada, tamanho e traço vivem no `IconBadge`, não aqui.
    expect(body).toContain("IconBadge");
    expect(readCode(`${UI}/IconBadge.tsx`)).toContain("strokeWidth={1.5}");
  });

  it("a seta do link de ação desloca 2px no hover, em 150ms", () => {
    const css = read("src/app/globals.css");
    const bloco = css.match(/\.rc2-action-link svg \{[^}]*\}/);
    expect(bloco).not.toBeNull();
    expect(bloco![0]).toContain("transform 150ms");
    expect(css).toContain("transform: translateX(2px)");
  });

  it("os cards de case usam espaçamento de seção de assinatura", () => {
    const body = read("src/components/marketing/home/HomeAuthority.tsx");
    expect(body).toMatch(/gap-8 md:grid-cols-3 md:gap-10/);
  });

  it("a Caption saiu de classe morta para uso real nos testemunhos", () => {
    for (const file of [
      "src/components/marketing/HomeReviews.tsx",
      "src/components/GoogleReviews.tsx",
    ]) {
      expect(read(file)).toContain("rc2-caption");
    }
  });

  it("a Caption está na escala da §6 (Light 300, 13–14px)", () => {
    const css = read("src/app/globals.css");
    const bloco = css.match(/\.rc2-caption \{[^}]*\}/);
    expect(bloco).not.toBeNull();
    expect(bloco![0]).toContain("font-weight: 300");
    expect(bloco![0]).toContain("font-size: 0.8125rem");
  });
});

describe("Anel de foco — visível de verdade", () => {
  const css = read("src/app/globals.css");

  /**
   * O anel existia no DOM e era invisível na tela: as utilities `ring-*`
   * produziam `color-mix(in oklab, #c2410c 20%, transparent)` a ~1.5px —
   * contraste perto de 1.2:1. Só apareceu medindo estilo computado com foco
   * por teclado; nenhum teste de código pegaria.
   */
  it("usa outline real, não as utilities de ring", () => {
    expect(css).toContain("outline-color: var(--rc2-focus-current)");
    expect(css).toContain("outline-width: 2px");
    expect(css).toContain("outline-offset: 2px");
  });

  it("nenhuma classe do sistema zera o outline no foco", () => {
    // `.rc2-action-link` trazia `focus-visible:outline-none` + o ring quebrado.
    const bloco = css.match(/\.rc2-action-link \{[^}]*\}/);
    expect(bloco).not.toBeNull();
    expect(bloco![0]).not.toContain("outline-none");
  });

  it("a regra fica fora de @layer, para vencer as utilities", () => {
    // Utilities ganham de `@layer components`; foi por isso que a primeira
    // tentativa de correção não teve efeito.
    const posRegra = css.indexOf("outline-color: var(--rc2-focus-current)");
    const posUltimoLayer = css.lastIndexOf("@layer");
    expect(posRegra).toBeGreaterThan(posUltimoLayer);
  });

  it("superfícies navy trocam a cor do anel por herança (regra nº 3)", () => {
    expect(css).toContain("--rc2-focus-current: var(--rc2-focus-ring-dark)");
    expect(css).toMatch(/:where\(footer,[^)]*\.bg-rc2-dark/);
  });
});

describe("Container de ícone — §6 Iconografia", () => {
  const badge = read(`${UI}/IconBadge.tsx`);

  it("é fonte única, não markup repetido por página", () => {
    for (const file of [
      "src/components/ui/SignalList.tsx",
      "src/components/marketing/home/HomeProblems.tsx",
      "src/components/marketing/home/HomeCompetencies.tsx",
    ]) {
      expect(read(file)).toContain("IconBadge");
    }
  });

  it("usa Accent Soft, radius 8px e borda hairline em área clara", () => {
    expect(badge).toContain("bg-rc2-accent-soft");
    expect(badge).toContain("rounded-lg");
    expect(badge).toContain("border-rc2-border");
    expect(badge).toContain("text-rc2-heading");
  });

  it("o container não muda de cor por estado", () => {
    // Mudaria de cor competiria com o Princípio 1: o laranja é do instante em
    // que algo muda de estado, não de uma moldura permanente.
    expect(badge).not.toContain("hover:bg-");
    expect(badge).not.toContain("group-hover:");
  });

  it("mantém o traço de 1.5px do sistema", () => {
    expect(badge).toContain("strokeWidth={1.5}");
  });
});

describe("Índice do blog — último post em destaque", () => {
  const pagina = readCode("src/app/(public)/blog/page.tsx");
  const card = readCode("src/components/blog/BlogCard.tsx");

  it("o destaque é o primeiro da consulta, que já vem por data desc", () => {
    expect(pagina).toContain("const [destaque, ...demais] = posts");
    expect(pagina).toContain('order("published_at", { ascending: false })');
  });

  it("destaque e demais usam variantes distintas do mesmo card", () => {
    expect(pagina).toContain('variant="feature"');
    expect(pagina).toContain('variant="grid"');
    expect(pagina).toContain("md:grid-cols-2");
  });

  it("as três variantes vivem num componente só", () => {
    expect(card).toContain('variant?: "row" | "feature" | "grid"');
    // A Home continua no `row` por padrão: dar destaque no blog não pode
    // mudar a seção Conteúdo por efeito colateral.
    expect(card).toContain('variant = "row"');
  });

  it("com um único post publicado, o grid não renderiza vazio", () => {
    expect(pagina).toContain("demais.length > 0");
  });

  it("o resumo aparece inteiro, sem truncar", () => {
    // O resumo é a única prévia do conteúdo no índice; cortá-lo em duas ou
    // três linhas escondia metade da frase. Os cards do grid se igualam em
    // altura pela linha do grid, então o texto completo não desalinha nada.
    expect(card).not.toContain("line-clamp");
    expect(card).toContain("justify-between");
  });

  it("respeita as proporções de imagem da §6", () => {
    // 3:2 em destaque, 4:3 em thumbnail.
    expect(card).toContain('isFeature && "aspect-[3/2]');
    expect(card).toContain('isGrid && "aspect-[4/3]"');
  });
});

describe("Header — a nav cabe na largura", () => {
  it("a nav desktop só aparece a partir de lg", () => {
    // Com seis itens mais o CTA, `md:flex` passava de 768px e criava overflow
    // horizontal em toda página.
    const header = readCode("src/components/layout/Header.tsx");
    expect(header).toContain("hidden lg:flex");
    expect(header).not.toContain("hidden md:flex");
    expect(header).toContain("lg:hidden");
  });
});

describe("Iconografia — nenhum clichê de IA", () => {
  it("não usa ícone de robô, cérebro ou chip", () => {
    for (const file of [
      "src/components/marketing/home/HomeProblems.tsx",
      "src/components/marketing/home/HomeCompetencies.tsx",
    ]) {
      const body = read(file);
      for (const banido of ["BrainCircuit", "Brain", "Bot,", "Cpu", "CircuitBoard"]) {
        expect(body).not.toContain(banido);
      }
    }
  });
});
