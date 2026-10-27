import { describe, expect, it } from "vitest";
import { generateToken } from "@/lib/newsletter/tokens";
import {
  CURRENT_TEMPLATE_VERSION,
  NEWSLETTER_FROM,
  NEWSLETTER_REPLY_TO,
  UnknownTemplateVersionError,
  buildLinks,
  renderEmail,
} from "@/lib/newsletter/templates";

// T-NL-U08 (SDD §17) e §9: contrato dos cabeçalhos RFC 8058, dos links e do conteúdo.
const BASE = "https://www.rc2solucoes.com.br";
const C = generateToken();
const U = generateToken();
const to = "pessoa@example.com";

const confirmation = () => renderEmail("confirmation", CURRENT_TEMPLATE_VERSION.confirmation, to, { confirmToken: C, unsubscribeToken: U }, BASE);
const unsubLink = () => renderEmail("unsubscribe_link", CURRENT_TEMPLATE_VERSION.unsubscribe_link, to, { confirmToken: null, unsubscribeToken: U }, BASE);

describe("links", () => {
  it("tokens no fragmento nas páginas e na query só no one-click; sempre HTTPS e sem analytics", () => {
    const links = buildLinks({ confirmToken: C, unsubscribeToken: U }, BASE);
    expect(links.confirm).toBe(`${BASE}/newsletter/confirmar#t=${C}`);
    expect(links.unsubscribePage).toBe(`${BASE}/newsletter/descadastro#t=${U}`);
    expect(links.oneClick).toBe(`${BASE}/api/newsletter/unsubscribe?t=${U}`);
    for (const url of [links.confirm!, links.unsubscribePage, links.oneClick]) {
      expect(url.startsWith("https://")).toBe(true);
      expect(url).not.toMatch(/utm_|gclid|fbclid|ref=|track|\bsource=/i);
    }
  });

  it("rejeita token malformado (nunca monta link com valor arbitrário)", () => {
    expect(() => buildLinks({ confirmToken: null, unsubscribeToken: "nlt_curto" }, BASE)).toThrow(TypeError);
    expect(() => buildLinks({ confirmToken: "x", unsubscribeToken: U }, BASE)).toThrow(TypeError);
  });
});

describe("e-mail de confirmação", () => {
  it("cabeçalhos RFC 8058: uma URI HTTPS única e POST one-click", () => {
    const { headers } = confirmation();
    expect(headers["List-Unsubscribe"]).toBe(`<${BASE}/api/newsletter/unsubscribe?t=${U}>`);
    expect(headers["List-Unsubscribe"].match(/<https:\/\//g)).toHaveLength(1);
    expect(headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
    expect(Object.keys(headers).sort()).toEqual(["List-Unsubscribe", "List-Unsubscribe-Post"]);
  });

  it("remetente, Reply-To, assunto e destinatário conforme o SDD §9", () => {
    const m = confirmation();
    expect(m.from).toBe("RC2 Soluções <newsletter@rc2solucoes.com.br>");
    expect(m.from).toBe(NEWSLETTER_FROM);
    expect(m.replyTo).toBe("contato@rc2solucoes.com.br");
    expect(m.replyTo).toBe(NEWSLETTER_REPLY_TO);
    expect(m.subject).toBe("Confirme sua inscrição na newsletter da RC2");
    expect(m.to).toBe(to);
  });

  it("HTML e texto trazem o link de confirmação (C) e o de descadastro (U); o texto não depende do HTML", () => {
    const m = confirmation();
    for (const body of [m.html, m.text]) {
      expect(body).toContain(`${BASE}/newsletter/confirmar#t=${C}`);
      expect(body).toContain(`${BASE}/newsletter/descadastro#t=${U}`);
    }
    expect(m.text).not.toMatch(/<[a-z][\s\S]*>/i);
    expect(m.text).toContain("48 horas");
  });

  it("nomeia os temas e NÃO promete frequência nem resultado", () => {
    const { html, text } = confirmation();
    for (const body of [html, text]) {
      expect(body).toMatch(/automação de processos, integração de sistemas e IA aplicada a operações/);
      expect(body).not.toMatch(/semanal|diári|mensal|quinzenal|toda semana|todo mês|resultado garantido/i);
    }
  });

  it("sem imagens remotas e sem rastreamento de abertura ou clique", () => {
    const { html } = confirmation();
    expect(html).not.toMatch(/<img\b/i);
    expect(html).not.toMatch(/url\(\s*['"]?https?:/i);
    expect(html).not.toMatch(/<link\b|<script\b|<iframe\b/i);
    expect(html).not.toMatch(/pixel|beacon|open\.gif|track/i);
    // Todo href é HTTPS para o próprio domínio (links não são reescritos por terceiros).
    for (const [, href] of html.matchAll(/href="([^"]+)"/g)) expect(href.startsWith(`${BASE}/`)).toBe(true);
  });

  it("é determinístico: o mesmo payload gera exatamente o mesmo conteúdo (idempotência entre tentativas)", () => {
    expect(confirmation()).toEqual(confirmation());
  });

  it("escapa HTML (o destinatário não entra no corpo; os valores dinâmicos são só os tokens)", () => {
    const { html } = confirmation();
    expect(html).not.toContain(to);
    expect(html).toMatch(/&quot;|"/);
  });

  it("exige o token C", () => {
    expect(() => renderEmail("confirmation", CURRENT_TEMPLATE_VERSION.confirmation, to, { confirmToken: null, unsubscribeToken: U }, BASE)).toThrow(TypeError);
  });
});

describe("e-mail de link de descadastro", () => {
  it("sem cabeçalhos RFC 8058 (não é mensagem de lista) e só com o link U", () => {
    const m = unsubLink();
    expect(m.headers).toEqual({});
    expect(m.subject).toBe("Descadastro da newsletter da RC2");
    expect(m.from).toBe(NEWSLETTER_FROM);
    expect(m.replyTo).toBe(NEWSLETTER_REPLY_TO);
    for (const body of [m.html, m.text]) {
      expect(body).toContain(`${BASE}/newsletter/descadastro#t=${U}`);
      expect(body).not.toContain("/newsletter/confirmar");
    }
    expect(m.html).not.toMatch(/<img\b/i);
  });

  it("é determinístico", () => {
    expect(unsubLink()).toEqual(unsubLink());
  });
});

describe("versão de template fixa por mensagem", () => {
  it("renderiza pela versão informada e recusa versão desconhecida ou de outro tipo", () => {
    expect(CURRENT_TEMPLATE_VERSION).toEqual({ confirmation: "confirmation-v1", unsubscribe_link: "unsubscribe-link-v1" });
    expect(() => renderEmail("confirmation", "confirmation-v999", to, { confirmToken: C, unsubscribeToken: U }, BASE)).toThrow(UnknownTemplateVersionError);
    expect(() => renderEmail("confirmation", "unsubscribe-link-v1", to, { confirmToken: C, unsubscribeToken: U }, BASE)).toThrow(UnknownTemplateVersionError);
    expect(() => renderEmail("unsubscribe_link", "confirmation-v1", to, { confirmToken: null, unsubscribeToken: U }, BASE)).toThrow(UnknownTemplateVersionError);
  });
});
