import Link from "next/link";
import { Logo } from "./Logo";
import { TrackedLink } from "@/components/tracking/TrackedLink";
import { services } from "@/lib/content/services";

const footerLinks = {
  empresa: [
    { href: "/sobre", label: "Sobre" },
    { href: "/blog", label: "Blog" },
    { href: "/contato", label: "Contato" },
  ],
  servicos: services.map(s => ({
    href: `/servicos/${s.slug}`,
    label: s.shortTitle,
  })),
};

const legalLinks = [
  { href: "/privacidade", label: "Política de Privacidade" },
  { href: "/termos", label: "Termos de Uso" },
];

export function Footer() {
  return (
    <footer className="bg-rc2-forest text-rc2-sand">
      {/* Transição tonal do conteúdo principal */}
      <div className="h-px bg-gradient-to-r from-transparent via-surface-3 to-transparent opacity-40" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-1">
            <Logo variant="dark" />
            <p className="mt-4 text-sm text-rc2-sand/88 leading-relaxed max-w-xs">
              Consultoria especializada em IA, automações e operações digitais
              para pequenas e médias empresas.
            </p>
          </div>

          {/* Empresa */}
          <div>
            <h3 className="rc2-label text-rc2-orange mb-4">Empresa</h3>
            <ul className="space-y-2">
              {footerLinks.empresa.map((link) => (
                <li key={link.href}>
                  {link.href === "/contato" ? (
                    <TrackedLink
                      href={link.href}
                      tracking={{ kind: "cta", location: "footer_empresa", label: "contato", destination: link.href }}
                      className="ui-focus-ring rounded-sm text-sm text-rc2-sand/88 hover:text-rc2-sand hover:underline transition-colors"
                    >
                      {link.label}
                    </TrackedLink>
                  ) : (
                    <Link
                      href={link.href}
                      className="ui-focus-ring rounded-sm text-sm text-rc2-sand/88 hover:text-rc2-sand hover:underline transition-colors"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Serviços */}
          <div>
            <h3 className="rc2-label text-rc2-orange mb-4">Serviços</h3>
            <ul className="space-y-2">
              {footerLinks.servicos.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="ui-focus-ring rounded-sm text-sm text-rc2-sand/88 hover:text-rc2-sand hover:underline transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h3 className="rc2-label text-rc2-orange mb-4">Contato</h3>
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
                  className="text-sm text-rc2-sand/88 hover:text-rc2-sand transition-colors"
                >
                  WhatsApp
                </TrackedLink>
              </li>
              <li>
                <a
                  href="mailto:contato@rc2solucoes.com.br"
                  className="text-sm text-rc2-sand/88 hover:text-rc2-sand transition-colors"
                >
                  contato@rc2solucoes.com.br
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-rc2-sand/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs font-normal text-rc2-sand text-center sm:text-left">
            © 2026 RC2 Soluções. Todos os direitos reservados.
          </p>
          <div className="flex gap-6">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="ui-focus-ring rounded-sm text-xs font-normal text-rc2-sand hover:underline transition-colors"
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
