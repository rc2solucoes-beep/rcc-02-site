// Layout das páginas que recebem token da newsletter (DEC-27 / PRP-10, opção O5).
//
// PROIBIDO importar aqui, ou nas páginas deste grupo, qualquer rastreador de terceiros:
// TrackingScripts, DelayedGtm, PageViewTracker, ConsentManager, GTM, GA4, Meta Pixel, Ahrefs ou
// o bootstrap de consentimento. Um teste estático (T-NL-U22) garante. O token vem no fragmento
// da URL e não pode alcançar nenhum script de terceiros.
export default function NewsletterTokenLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main-content" className="flex-1 bg-rc2-bg">
      {children}
    </main>
  );
}
