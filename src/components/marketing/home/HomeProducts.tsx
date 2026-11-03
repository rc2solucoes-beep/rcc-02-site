import { ArrowRight, ArrowUpRight } from "lucide-react";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { TrackedLink } from "@/components/tracking/TrackedLink";
import { HOME_PRODUCTS } from "@/lib/content/home";

const products = [HOME_PRODUCTS.zapbox, HOME_PRODUCTS.agendaConfirmada];

export function HomeProducts() {
  return (
    <section className="bg-rc2-bg-alt rc2-section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <SectionLabel className="rc2-rule block mb-5">Construído pela RC2</SectionLabel>
          <h2 className="rc2-h2 text-rc2-heading mb-12 max-w-2xl">
            Produtos e soluções próprias.
          </h2>
        </ScrollReveal>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {products.map((product, index) => (
            <ScrollReveal
              key={product.name}
              delay={index * 90}
              className="rc2-card flex flex-col p-6 md:p-7"
            >
              <SectionLabel className="block mb-2">{product.category}</SectionLabel>
              <h3 className="mb-2 text-2xl font-semibold leading-snug text-rc2-heading lg:text-[28px]">
                {product.name}
              </h3>
              <p className="mb-4 text-base font-medium leading-[1.75] text-rc2-text">
                {product.tagline}
              </p>
              <p className="flex-1 text-base leading-[1.75] text-rc2-text-secondary">
                {product.description}
              </p>
              <TrackedLink
                href={product.href}
                {...(product.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                tracking={{
                  kind: "cta",
                  location: "home_products",
                  label: product.analyticsLabel,
                  destination: product.href,
                }}
                className="rc2-action-link mt-5 min-h-11 max-w-full self-start py-2 text-base"
              >
                {product.ctaLabel}
                {product.external ? (
                  <ArrowUpRight size={14} aria-hidden="true" />
                ) : (
                  <ArrowRight size={14} aria-hidden="true" />
                )}
              </TrackedLink>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
