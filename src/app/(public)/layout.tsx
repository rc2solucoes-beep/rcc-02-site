import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FloatingWhatsApp } from "@/components/marketing/FloatingWhatsApp";
import { ConsentManager } from "@/components/tracking/ConsentManager";
import { TrackingScripts } from "@/components/tracking/TrackingScripts";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <TrackingScripts />
      <Header />
      <main id="main-content" className="flex-1">{children}</main>
      <Footer />
      <FloatingWhatsApp />
      <ConsentManager />
    </>
  );
}
