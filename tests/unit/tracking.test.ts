import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  trackCtaClick,
  trackEvent,
  trackLeadEvent,
  trackPageView,
  trackWhatsappClick,
} from "@/lib/tracking";

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

describe("tracking helpers", () => {
  beforeEach(() => {
    window.dataLayer = [];
  });

  afterEach(() => {
    delete window.dataLayer;
    vi.restoreAllMocks();
  });

  it("keeps trackEvent compatibility", () => {
    trackEvent("legacy_event", { location: "test" });

    expect(window.dataLayer).toEqual([
      { event: "legacy_event", location: "test" },
    ]);
  });

  it("pushes page_view payload", () => {
    trackPageView({
      page_path: "/contato?utm_source=test",
      page_location: "https://www.rc2solucoes.com.br/contato?utm_source=test",
      page_title: "Contato",
    });

    expect(window.dataLayer).toEqual([
      {
        event: "page_view",
        page_path: "/contato?utm_source=test",
        page_location: "https://www.rc2solucoes.com.br/contato?utm_source=test",
        page_title: "Contato",
      },
    ]);
  });

  it("pushes cta_click payload", () => {
    trackCtaClick({
      location: "header",
      label: "diagnostico_gratuito",
      destination: "/contato",
    });

    expect(window.dataLayer).toEqual([
      {
        event: "cta_click",
        location: "header",
        label: "diagnostico_gratuito",
        destination: "/contato",
      },
    ]);
  });

  it("pushes whatsapp_click payload", () => {
    trackWhatsappClick({
      location: "footer",
      label: "whatsapp",
      destination: "https://wa.me/5511988028550",
    });

    expect(window.dataLayer).toEqual([
      {
        event: "whatsapp_click",
        location: "footer",
        label: "whatsapp",
        destination: "https://wa.me/5511988028550",
      },
    ]);
  });

  it("pushes lead success without personal data", () => {
    trackLeadEvent("generate_lead_success", {
      form_name: "diagnostico_gratuito",
      lead_source: "website",
      solution_interest: "Automações com IA",
      company_size: "11-50 colaboradores",
      company_segment: "Varejo",
    });

    const [event] = window.dataLayer ?? [];
    expect(event).toEqual({
      event: "generate_lead_success",
      form_name: "diagnostico_gratuito",
      lead_source: "website",
      solution_interest: "Automações com IA",
      company_size: "11-50 colaboradores",
      company_segment: "Varejo",
    });
    expect(Object.keys(event)).not.toEqual(
      expect.arrayContaining(["name", "email", "phone", "whatsapp", "message", "ip"])
    );
  });
});
