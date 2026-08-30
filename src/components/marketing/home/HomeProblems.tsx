import { SectionLabel } from "@/components/ui/SectionLabel";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { HOME_PROBLEMS } from "@/lib/content/home";

export function HomeProblems() {
  return (
    <section className="rc2-grain relative overflow-hidden bg-rc2-dark rc2-section">
      <div className="rc2-blueprint-dark pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <SectionLabel className="rc2-rule block mb-5 text-rc2-brand">
            Onde a operação trava
          </SectionLabel>
          <h2 className="rc2-h2 text-rc2-dark-text mb-4 max-w-2xl">
            A operação cresceu. O processo não acompanhou.
          </h2>
          <p className="text-rc2-dark-text-secondary text-lg leading-relaxed max-w-2xl mb-12">
            Quatro sintomas aparecem quase sempre juntos — e nenhum deles se
            resolve comprando mais uma ferramenta.
          </p>
        </ScrollReveal>

        <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-rc2-dark-border bg-rc2-dark-border md:grid-cols-2">
          {HOME_PROBLEMS.map((problem) => (
            <li key={problem.title} className="bg-rc2-dark px-6 py-7">
              <h3 className="text-base font-semibold text-rc2-dark-text mb-2">
                {problem.title}
              </h3>
              <p className="text-sm text-rc2-dark-text-secondary leading-relaxed mb-4">
                {problem.description}
              </p>
              <ul className="space-y-1.5">
                {problem.examples.map((example) => (
                  <li
                    key={example}
                    className="flex items-start gap-2.5 text-sm text-rc2-dark-text-secondary"
                  >
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-rc2-brand" aria-hidden />
                    <span>{example}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
