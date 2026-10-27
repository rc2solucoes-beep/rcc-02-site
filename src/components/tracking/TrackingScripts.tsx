import { Suspense } from "react";
import { DelayedGtm } from "@/components/tracking/DelayedGtm";
import { PageViewTracker } from "@/components/tracking/PageViewTracker";
import { getConsentBootstrapScript } from "@/lib/consent";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? "GTM-MQF4K77";

// Rastreadores de terceiros do site. Montado SOMENTE nos layouts que podem carregá-los
// ((public) e not-found). As páginas de token da newsletter ficam no grupo (newsletter), cujo
// layout não importa este componente (DEC-27 / PRP-10, opção O5): o código de rastreamento nem é
// enviado ao navegador ali. O bootstrap síncrono de consentimento vem antes do carregador do GTM.
export function TrackingScripts() {
  return (
    <>
      <script
        id="rc2-consent-bootstrap"
        dangerouslySetInnerHTML={{ __html: getConsentBootstrapScript() }}
      />
      <DelayedGtm gtmId={GTM_ID} />
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
    </>
  );
}
