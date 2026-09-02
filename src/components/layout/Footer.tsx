import Link from "next/link";
import { Logo } from "./Logo";
import { TrackedLink } from "@/components/tracking/TrackedLink";
import {
  FOOTER_COMPANY_LINKS,
  FOOTER_PRODUCT_LINK,
  FOOTER_SOLUTION_LINKS,
} from "@/lib/content/navigation";

const legalLinks = [
  { href: "/privacidade", label: "Política de Privacidade" },
  { href: "/termos", label: "Termos de Uso" },
];

export function Footer() {
  return (
    <footer className="border-t border-rc2-dark-border bg-rc2-dark text-rc2-dark-text">
      {/* Transição tonal do conteúdo principal */}
      <div className="h-px bg-gradient-to-r from-transparent via-rc2-border to-transparent opacity-40" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-1">
            <Logo variant="dark" />
            <p className="mt-4 text-sm text-rc2-dark-text-secondary leading-relaxed max-w-xs">
              Consultoria e implementação de automação de processos, integração
              de sistemas e IA para operações.
            </p>
          </div>

          {/* Empresa */}
          <div>
            <h3 className="rc2-label mb-4 text-rc2-brand">Empresa</h3>
            <ul className="space-y-2">
              {FOOTER_COMPANY_LINKS.map((link) => (
                <li key={link.href}>
                  {link.href === "/contato" ? (
                    <TrackedLink
                      href={link.href}
                      tracking={{ kind: "cta", location: "footer_empresa", label: "contato", destination: link.href }}
                      className="ui-focus-ring rounded-sm text-sm text-rc2-dark-text-secondary hover:text-rc2-dark-text hover:underline transition-colors"
                    >
                      {link.label}
                    </TrackedLink>
                  ) : (
                    <Link
                      href={link.href}
                      className="ui-focus-ring rounded-sm text-sm text-rc2-dark-text-secondary hover:text-rc2-dark-text hover:underline transition-colors"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Soluções */}
          <div>
            <h3 className="rc2-label mb-4 text-rc2-brand">Soluções</h3>
            <ul className="space-y-2">
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
                    className="ui-focus-ring rounded-sm text-sm text-rc2-dark-text-secondary hover:text-rc2-dark-text hover:underline transition-colors"
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
              className="ui-focus-ring rounded-sm text-sm text-rc2-dark-text-secondary hover:text-rc2-dark-text hover:underline transition-colors"
            >
              {FOOTER_PRODUCT_LINK.label} — {FOOTER_PRODUCT_LINK.description}
            </TrackedLink>
          </div>

          {/* Contato */}
          <div>
            <h3 className="rc2-label mb-4 text-rc2-brand">Contato</h3>
            <ul className="space-y-2">
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
                  className="text-sm text-rc2-dark-text-secondary hover:text-rc2-dark-text transition-colors"
                >
                  Falar pelo WhatsApp
                </TrackedLink>
              </li>
              <li>
                <a
                  href="mailto:contato@rc2solucoes.com.br"
                  className="text-sm text-rc2-dark-text-secondary hover:text-rc2-dark-text transition-colors break-words"
                >
                  contato@rc2solucoes.com.br
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-rc2-dark-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs font-normal text-rc2-dark-text-secondary text-center sm:text-left">
            © 2026 RC2 Soluções. Todos os direitos reservados.
          </p>
          <div className="flex gap-6">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="ui-focus-ring rounded-sm text-xs font-normal text-rc2-dark-text-secondary hover:text-rc2-dark-text hover:underline transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
