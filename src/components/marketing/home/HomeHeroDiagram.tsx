const INPUTS = ["Processos", "Sistemas", "Dados"] as const;

/**
 * Diagrama estrutural do hero: Processos + Sistemas + Dados → RC2 →
 * Operação integrada. Sem dependência nova; empilha na vertical em telas
 * pequenas. Transmite informação, portanto expõe alternativa textual.
 */
export function HomeHeroDiagram() {
  return (
    <div
      role="img"
      aria-label="Processos, sistemas e dados convergem para a RC2 e resultam em uma operação integrada."
      className="mt-12 rounded-xl border border-rc2-border bg-rc2-surface/70 p-5 md:p-6"
    >
      <div className="flex flex-col items-stretch gap-4 md:flex-row md:items-center md:gap-5">
        <ul className="flex flex-col gap-2" aria-hidden>
          {INPUTS.map((item) => (
            <li
              key={item}
              className="rounded-md border border-rc2-border-soft bg-rc2-bg-alt px-4 py-2.5 text-sm font-medium text-rc2-text"
            >
              {item}
            </li>
          ))}
        </ul>

        <span
          className="self-center text-rc2-brand-text md:px-1"
          aria-hidden
        >
          <span className="hidden md:inline">→</span>
          <span className="md:hidden">↓</span>
        </span>

        <div
          className="rounded-md border border-rc2-heading bg-rc2-heading px-5 py-3 text-center text-sm font-semibold uppercase tracking-[0.10em] text-rc2-dark-text"
          aria-hidden
        >
          RC2
        </div>

        <span
          className="self-center text-rc2-brand-text md:px-1"
          aria-hidden
        >
          <span className="hidden md:inline">→</span>
          <span className="md:hidden">↓</span>
        </span>

        <div
          className="flex-1 rounded-md border border-rc2-brand/30 bg-rc2-accent-soft px-5 py-3 text-center text-sm font-semibold text-rc2-heading md:text-left"
          aria-hidden
        >
          Operação integrada
        </div>
      </div>
    </div>
  );
}
