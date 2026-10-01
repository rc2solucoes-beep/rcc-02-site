import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FloatingWhatsApp } from "@/components/marketing/FloatingWhatsApp";
import { ConsentManager } from "@/components/tracking/ConsentManager";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">{children}</main>
      <Footer />
      <FloatingWhatsApp />
      <ConsentManager />
    </>
  );
}
