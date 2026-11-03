import Link from "next/link";
import { Logo } from "./Logo";
import { TrackedLink } from "@/components/tracking/TrackedLink";
import { ConsentPreferencesButton } from "@/components/tracking/ConsentManager";
import {
  FOOTER_COMPANY_LINKS,
  FOOTER_PRODUCT_LINK,
  FOOTER_SOLUTION_LINKS,
} from "@/lib/content/navigation";

const footerLink =
  "ui-focus-ring inline-flex min-h-11 min-w-11 items-center rounded-sm py-2 text-base text-rc2-dark-text-secondary underline-offset-4 transition-colors hover:text-rc2-dark-text hover:underline";

const legalLink =
  "ui-focus-ring inline-flex min-h-11 min-w-11 items-center rounded-sm py-2 text-sm font-normal text-rc2-dark-text-secondary underline-offset-4 transition-colors hover:text-rc2-dark-text hover:underline";

const legalLinks = [
  { href: "/privacidade", label: "Política de Privacidade" },
  { href: "/termos", label: "Termos de Uso" },
];

export function Footer() {
  return (
    <footer className="border-t border-rc2-dark-border bg-rc2-dark text-rc2-dark-text">
      {/* Transição tonal do conteúdo principal */}
      <div className="h-px bg-gradient-to-r from-transparent via-rc2-border to-transparent opacity-40" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10 xl:gap-12">
          {/* Brand */}
          <div className="min-w-0 sm:col-span-2 lg:col-span-1">
            <Logo
              variant="dark"
              crop
              preloadImage={false}
              className="inline-flex min-h-11 items-center [--rc2-logo-useful:100px] lg:[--rc2-logo-useful:106px]"
            />
            <p className="mt-4 max-w-xs text-base leading-[1.75] text-rc2-dark-text-secondary">
              Consultoria e implementação de automação de processos, integração
              de sistemas e IA para operações.
            </p>
          </div>

          {/* Empresa */}
          <div className="min-w-0">
            <h3 className="rc2-label mb-4 text-rc2-brand">Empresa</h3>
            <ul>
              {FOOTER_COMPANY_LINKS.map((link) => (
                <li key={link.href}>
                  {link.href === "/contato" ? (
                    <TrackedLink
                      href={link.href}
                      tracking={{ kind: "cta", location: "footer_empresa", label: "contato", destination: link.href }}
                      className={footerLink}
                    >
                      {link.label}
                    </TrackedLink>
                  ) : (
                    <Link
                      href={link.href}
                      className={footerLink}
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Soluções */}
          <div className="min-w-0">
            <h3 className="rc2-label mb-4 text-rc2-brand">Soluções</h3>
            <ul>
              {FOOTER_SOLUTION_LINKS.map((link) => (
                <li key={link.href}>
                  <TrackedLink
                    href={link.href}
                    tracking={{
                      kind: "cta",
                      location: "footer_solucoes",
                      label: link.analyticsLabel,
                      destination: link.href,
                    }}
                    className={footerLink}
                  >
                    {link.label}
                  </TrackedLink>
                </li>
              ))}
            </ul>

            <h3 className="rc2-label mb-3 mt-6 text-rc2-brand">Produto</h3>
            {/* Fase 6E: destino interno (`/zapbox`) — sem semântica de saída. */}
            <TrackedLink
              href={FOOTER_PRODUCT_LINK.href}
              tracking={{
                kind: "cta",
                location: "footer_produto",
                label: FOOTER_PRODUCT_LINK.analyticsLabel,
                destination: FOOTER_PRODUCT_LINK.href,
              }}
              className={footerLink}
            >
              {FOOTER_PRODUCT_LINK.label} — {FOOTER_PRODUCT_LINK.description}
            </TrackedLink>
          </div>

          {/* Contato */}
          <div className="min-w-0">
            <h3 className="rc2-label mb-4 text-rc2-brand">Contato</h3>
            <ul>
              <li>
                <TrackedLink
                  href="https://wa.me/5511988028550"
                  target="_blank"
                  rel="noopener noreferrer"
                  tracking={{
                    kind: "whatsapp",
                    location: "footer_contact",
                    label: "whatsapp",
                    destination: "https://wa.me/5511988028550",
                  }}
                  className={footerLink}
                >
                  Falar pelo WhatsApp
                </TrackedLink>
              </li>
              <li>
                <a
                  href="mailto:contato@rc2solucoes.com.br"
                  className={`${footerLink} break-words`}
                >
                  contato@rc2solucoes.com.br
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col gap-4 border-t border-rc2-dark-border pt-6 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm font-normal text-rc2-dark-text-secondary">
            © 2026 RC2 Soluções. Todos os direitos reservados.
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={legalLink}
              >
                {link.label}
              </Link>
            ))}
            <ConsentPreferencesButton />
          </div>
        </div>
      </div>
    </footer>
  );
}
