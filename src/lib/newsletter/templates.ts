// Templates transacionais da newsletter (SDD Newsletter §9): confirmação de inscrição e link de
// descadastro. HTML + texto, sem imagem remota, sem rastreamento de clique/abertura e sem parâmetro
// de analytics nos links. Cada mensagem FIXA a versão do template na preparação (§8.2): o conteúdo
// é determinístico (nada depende de relógio), então as tentativas do mesmo item são idênticas.
//
// Mudar o conteúdo exige uma NOVA versão; as antigas permanecem registradas por pelo menos 24 h
// depois de qualquer mudança (as mensagens em voo guardam a versão antiga no payload).

import { BASE_URL } from "@/lib/siteMetadata";
import { isWellFormedToken } from "@/lib/newsletter/tokens";
import type { OutgoingEmail } from "@/lib/newsletter/provider";

export const NEWSLETTER_FROM = "RC2 Soluções <newsletter@rc2solucoes.com.br>";
export const NEWSLETTER_REPLY_TO = "contato@rc2solucoes.com.br";

export type TemplateKind = "confirmation" | "unsubscribe_link";

export const CURRENT_TEMPLATE_VERSION: Record<TemplateKind, string> = {
  confirmation: "confirmation-v1",
  unsubscribe_link: "unsubscribe-link-v1",
};

// Cores do e-mail: clientes de e-mail não suportam variáveis CSS. Valores dos tokens da marca
// (--rc2-heading, --rc2-text, --rc2-brand, --rc2-bg, --rc2-border), centralizados aqui.
const C = { heading: "#0B1726", text: "#24313D", muted: "#66717D", brand: "#FF5F1F", bg: "#FBFAF8", border: "#DDE2E7" } as const;

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export type TemplateTokens = { confirmToken: string | null; unsubscribeToken: string };

/** Links do e-mail. Tokens em fragmento (páginas) ou query (one-click, inevitável); nunca utm_*. */
export function buildLinks(tokens: TemplateTokens, baseUrl: string = BASE_URL) {
  if (!isWellFormedToken(tokens.unsubscribeToken)) throw new TypeError("token de descadastro malformado");
  if (tokens.confirmToken !== null && !isWellFormedToken(tokens.confirmToken)) throw new TypeError("token de confirmação malformado");
  return {
    confirm: tokens.confirmToken ? `${baseUrl}/newsletter/confirmar#t=${tokens.confirmToken}` : null,
    unsubscribePage: `${baseUrl}/newsletter/descadastro#t=${tokens.unsubscribeToken}`,
    oneClick: `${baseUrl}/api/newsletter/unsubscribe?t=${tokens.unsubscribeToken}`,
  };
}

function shell(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:24px;background:${C.bg};font-family:Arial,Helvetica,sans-serif;color:${C.text};line-height:1.6;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#FFFFFF;border:1px solid ${C.border};">
<tr><td style="padding:32px;">
<p style="margin:0 0 16px;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;color:${C.muted};">RC2 Soluções</p>
${bodyHtml}
<p style="margin:32px 0 0;font-size:12px;color:${C.muted};">RC2 Soluções · Automação de processos, integração de sistemas e IA para operações.</p>
</td></tr></table></body></html>`;
}

const button = (href: string, label: string) =>
  `<p style="margin:24px 0;"><a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 24px;background:${C.brand};color:${C.heading};font-weight:bold;text-decoration:none;">${escapeHtml(label)}</a></p>`;

type Rendered = Pick<OutgoingEmail, "subject" | "html" | "text" | "headers" | "from" | "replyTo">;

function confirmation(tokens: TemplateTokens, baseUrl: string): Rendered {
  const links = buildLinks(tokens, baseUrl);
  if (!links.confirm) throw new TypeError("a confirmação exige o token C");
  const subject = "Confirme sua inscrição na newsletter da RC2";
  const html = shell(
    subject,
    `<h1 style="margin:0 0 16px;font-size:22px;color:${C.heading};">Confirme sua inscrição</h1>
<p style="margin:0 0 12px;">Este endereço de e-mail foi informado no site da RC2 Soluções para receber a newsletter. Os temas são automação de processos, integração de sistemas e IA aplicada a operações.</p>
<p style="margin:0 0 12px;">Para confirmar, use o botão abaixo. O link vale por 48 horas.</p>
${button(links.confirm, "Confirmar inscrição")}
<p style="margin:0 0 12px;">Se o botão não funcionar, copie e cole este endereço no navegador:<br><span style="word-break:break-all;">${escapeHtml(links.confirm)}</span></p>
<p style="margin:16px 0 0;">Não foi você? Ignore este e-mail ou <a href="${escapeHtml(links.unsubscribePage)}" style="color:${C.heading};">descadastre-se</a>.</p>`,
  );
  const text = [
    "Confirme sua inscrição",
    "",
    "Este endereço de e-mail foi informado no site da RC2 Soluções para receber a newsletter. Os temas são automação de processos, integração de sistemas e IA aplicada a operações.",
    "",
    "Para confirmar, abra o link abaixo. Ele vale por 48 horas.",
    links.confirm,
    "",
    "Não foi você? Ignore este e-mail ou descadastre-se:",
    links.unsubscribePage,
    "",
    "RC2 Soluções",
  ].join("\n");
  return {
    from: NEWSLETTER_FROM,
    replyTo: NEWSLETTER_REPLY_TO,
    subject,
    html,
    text,
    // RFC 8058: uma URI HTTPS única por mensagem + POST one-click. Também na confirmação: dá ao
    // titular que não pediu a inscrição uma saída de um clique.
    headers: {
      "List-Unsubscribe": `<${links.oneClick}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}

function unsubscribeLink(tokens: TemplateTokens, baseUrl: string): Rendered {
  const links = buildLinks({ confirmToken: null, unsubscribeToken: tokens.unsubscribeToken }, baseUrl);
  const subject = "Descadastro da newsletter da RC2";
  const html = shell(
    subject,
    `<h1 style="margin:0 0 16px;font-size:22px;color:${C.heading};">Descadastro da newsletter</h1>
<p style="margin:0 0 12px;">Recebemos um pedido de link para descadastrar este endereço da newsletter da RC2 Soluções.</p>
${button(links.unsubscribePage, "Descadastrar")}
<p style="margin:0 0 12px;">Se o botão não funcionar, copie e cole este endereço no navegador:<br><span style="word-break:break-all;">${escapeHtml(links.unsubscribePage)}</span></p>
<p style="margin:16px 0 0;">Não pediu este link? Ignore este e-mail: nada muda.</p>`,
  );
  const text = [
    "Descadastro da newsletter",
    "",
    "Recebemos um pedido de link para descadastrar este endereço da newsletter da RC2 Soluções.",
    links.unsubscribePage,
    "",
    "Não pediu este link? Ignore este e-mail: nada muda.",
    "",
    "RC2 Soluções",
  ].join("\n");
  // Sem cabeçalhos RFC 8058: não é mensagem de lista (SDD §9).
  return { from: NEWSLETTER_FROM, replyTo: NEWSLETTER_REPLY_TO, subject, html, text, headers: {} };
}

const RENDERERS: Record<string, { kind: TemplateKind; render: (t: TemplateTokens, baseUrl: string) => Rendered }> = {
  "confirmation-v1": { kind: "confirmation", render: confirmation },
  "unsubscribe-link-v1": { kind: "unsubscribe_link", render: unsubscribeLink },
};

export class UnknownTemplateVersionError extends Error {
  constructor() {
    super("versão de template desconhecida");
    this.name = "UnknownTemplateVersionError";
  }
}

/** Renderiza pela versão FIXADA no payload (não pela vigente) e confere que ela serve ao tipo. */
export function renderEmail(
  kind: TemplateKind,
  templateVersion: string,
  to: string,
  tokens: TemplateTokens,
  baseUrl: string = BASE_URL,
): OutgoingEmail {
  const entry = RENDERERS[templateVersion];
  if (!entry || entry.kind !== kind) throw new UnknownTemplateVersionError();
  return { ...entry.render(tokens, baseUrl), to };
}
