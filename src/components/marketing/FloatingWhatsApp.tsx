import { TrackedLink } from "@/components/tracking/TrackedLink";

const WHATSAPP_MESSAGE =
  "Olá! Vim pelo site e quero saber como a RC2 pode ajudar minha empresa.";
const WHATSAPP_URL = `https://wa.me/5511988028550?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

/**
 * Botão flutuante de WhatsApp, presente em todas as páginas públicas.
 * Verde da marca WhatsApp para reconhecimento imediato; rastreado via GTM.
 */
export function FloatingWhatsApp() {
  return (
    <TrackedLink
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      tracking={{
        kind: "whatsapp",
        location: "floating_button",
        label: "floating_whatsapp",
        destination: WHATSAPP_URL,
      }}
      className="group fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg ring-1 ring-black/5 transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rc2-orange focus-visible:ring-offset-2"
    >
      {/* Halo de pulso — chama atenção sem ser intrusivo */}
      <span
        className="absolute inset-0 rounded-full bg-[#25D366] opacity-40 motion-safe:animate-ping"
        aria-hidden
      />
      {/* Glifo do WhatsApp */}
      <svg viewBox="0 0 24 24" className="relative h-7 w-7 fill-current" aria-hidden>
        <path d="M19.05 4.91A9.816 9.816 0 0 0 12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21h.004c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01zM12.04 20.15h-.004c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.264 8.264 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.82 2.42a8.183 8.183 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43-.14-.01-.31-.01-.48-.01-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29z" />
      </svg>
      {/* Rótulo no hover (desktop) */}
      <span className="pointer-events-none absolute right-16 hidden whitespace-nowrap rounded-md bg-rc2-ink px-3 py-1.5 text-xs font-medium text-rc2-sand opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100 sm:block">
        Fale no WhatsApp
      </span>
    </TrackedLink>
  );
}
