import { SectionLabel } from "@/components/ui/SectionLabel";

export default function HomePage() {
  return (
    <section className="flex-1 flex items-center justify-center min-h-[70vh] px-4">
      <div className="text-center max-w-2xl">
        <SectionLabel className="block mb-4">Em construção</SectionLabel>
        <h1 className="rc2-display text-5xl md:text-7xl text-rc2-ebony mb-6">
          RC2 Soluções
        </h1>
        <p className="text-lg text-rc2-ebony/70 max-w-md mx-auto">
          IA, Automações e Operações Digitais para PMEs.
        </p>
      </div>
    </section>
  );
}
