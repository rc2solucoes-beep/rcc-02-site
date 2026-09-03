const INPUTS = ["Processos", "Sistemas", "Dados"] as const;

/**
 * Diagrama estrutural do hero.
 *
 * A leitura é a mesma de antes — processos, sistemas e dados convergem para a
 * RC2 e resultam em operação integrada —, mas a linguagem deixou de ser caixa
 * arredondada com seta desenhada em texto. Agora são nós, trilhas e um ponto de
 * interrupção: a gramática do Signal Interrupt aplicada à composição, sem
 * desenhar o logo.
 *
 * O laranja aparece uma única vez, no ponto onde o fluxo muda de estado. É o
 * evento do diagrama, não a sua decoração.
 *
 * Transmite informação, portanto expõe alternativa textual e esconde a
 * estrutura visual de tecnologias assistivas.
 */
export function HomeHeroDiagram() {
  return (
    <div
      role="img"
      aria-label="Processos, sistemas e dados convergem para a RC2 e resultam em uma operação integrada."
      className="mt-4 lg:mt-0"
    >
      <div aria-hidden className="relative">
        {/* Anotação técnica — a legenda do próprio diagrama. */}
        <div className="mb-5 flex items-baseline gap-3">
          <span className="rc2-label text-rc2-brand-text">Fluxo</span>
          <span className="h-px flex-1 bg-rc2-border" />
          <span className="rc2-label text-rc2-text-secondary">
            Estado atual → operação
          </span>
        </div>

        <div className="flex flex-col gap-7">
          {/* Entradas: nós empilhados, ligados por uma trilha vertical. */}
          <ul className="relative flex flex-col gap-3 md:pr-10">
            <span
              className="absolute left-[3px] top-3 bottom-3 hidden w-px bg-rc2-border md:block"
            />
            {INPUTS.map((item) => (
              <li
                key={item}
                className="relative flex items-center gap-4 text-sm font-medium text-rc2-text"
              >
                <span className="relative z-10 h-[7px] w-[7px] shrink-0 rounded-full border border-rc2-text-secondary bg-rc2-bg" />
                <span className="h-px w-5 shrink-0 bg-rc2-border md:w-8" />
                {item}
              </li>
            ))}
          </ul>

          {/* Núcleo: onde o fluxo é interrompido e muda de estado. */}
          <div className="relative flex items-center justify-start md:justify-center">
            <span className="hidden h-px w-10 bg-rc2-border md:block" />
            <span className="relative flex items-center">
              <span className="h-9 w-[3px] bg-rc2-heading" />
              <span className="mx-[5px] h-9 w-[3px] bg-rc2-brand" />
              <span className="h-9 w-[3px] bg-rc2-heading" />
            </span>
            <span className="ml-4 text-sm font-semibold uppercase tracking-[0.06em] text-rc2-heading">
              RC2
            </span>
            <span className="hidden h-px w-10 bg-rc2-border md:ml-4 md:block" />
          </div>

          {/* Saída: o estado resultante, com indicador ativo. */}
          <div className="relative md:pl-10">
            <div className="border-l-2 border-rc2-brand pl-5">
              <p className="text-sm font-semibold text-rc2-heading">
                Operação integrada
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-rc2-text-secondary">
                Processos conectados, sem retrabalho e com rastreabilidade.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
