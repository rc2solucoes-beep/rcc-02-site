import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { createElement } from "react";
import { PageViewTracker } from "@/components/tracking/PageViewTracker";
import {
  trackCtaClick,
  trackEvent,
  trackLeadEvent,
  trackPageView,
  trackWhatsappClick,
} from "@/lib/tracking";
import type { CompanySegmentCategory, PageViewPayload } from "@/lib/tracking";

const navigationState = vi.hoisted(() => ({
  pathname: "/",
  searchParams: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationState.pathname,
  useSearchParams: () => navigationState.searchParams,
}));

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

describe("tracking helpers", () => {
  beforeEach(() => {
    window.dataLayer = [];
    navigationState.pathname = "/";
    navigationState.searchParams = new URLSearchParams();
    window.history.replaceState(null, "", "/");
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
      page_path: "/contato",
      page_location: "https://www.rc2solucoes.com.br/contato",
      page_title: "Contato",
    });

    expect(window.dataLayer).toEqual([
      {
        event: "page_view",
        page_path: "/contato",
        page_location: "https://www.rc2solucoes.com.br/contato",
        page_title: "Contato",
      },
    ]);
  });

  it("prevents page_view payload from overriding the fixed event name", () => {
    trackPageView({
      page_path: "/contato",
      page_location: "https://www.rc2solucoes.com.br/contato",
      page_title: "Contato",
      event: "spoofed",
    } as PageViewPayload & { event: string });

    expect(window.dataLayer).toEqual([
      {
        page_path: "/contato",
        page_location: "https://www.rc2solucoes.com.br/contato",
        page_title: "Contato",
        event: "page_view",
      },
    ]);
  });

  it("sanitizes page view paths before pushing to dataLayer", () => {
    navigationState.pathname = "/contato";
    navigationState.searchParams = new URLSearchParams("ref=campaign&secret=value");
    window.history.replaceState(null, "", "/contato?ref=campaign&secret=value#section");
    document.title = "Contato";

    render(createElement(PageViewTracker));

    expect(window.dataLayer).toEqual([
      {
        event: "page_view",
        page_path: "/contato",
        page_location: `${window.location.origin}/contato`,
        page_title: "Contato",
      },
    ]);
  });

  it("tracks each pathname once while ignoring query-only navigation", () => {
    navigationState.pathname = "/contato";
    document.title = "Contato";
    const view = render(createElement(PageViewTracker));

    expect(window.dataLayer).toEqual([{
      event: "page_view",
      page_path: "/contato",
      page_location: `${window.location.origin}/contato`,
      page_title: "Contato",
    }]);

    for (const query of ["utm_source=google", "gclid=abc", "fbclid=abc", "gtm_debug=1"]) {
      navigationState.searchParams = new URLSearchParams(query);
      window.history.replaceState(null, "", `/contato?${query}`);
      view.rerender(createElement(PageViewTracker));
    }
    expect(window.dataLayer).toHaveLength(1);

    navigationState.pathname = "/solucoes";
    document.title = "Soluções";
    window.history.pushState(null, "", "/solucoes");
    view.rerender(createElement(PageViewTracker));
    expect(window.dataLayer).toHaveLength(2);
    expect(window.dataLayer?.[1]).toMatchObject({ event: "page_view", page_path: "/solucoes" });

    navigationState.pathname = "/contato";
    document.title = "Contato";
    window.history.replaceState(null, "", "/contato");
    view.rerender(createElement(PageViewTracker));
    expect(window.dataLayer).toHaveLength(3);
    expect(window.dataLayer?.[2]).toMatchObject({ event: "page_view", page_path: "/contato" });
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
    const segment: CompanySegmentCategory = "varejo";

    trackLeadEvent("generate_lead_success", {
      form_name: "diagnostico_gratuito",
      lead_source: "website",
      solution_interest: "Automações com IA",
      company_size: "11-50 colaboradores",
      company_segment: segment,
    });

    const [event] = window.dataLayer ?? [];
    expect(event).toEqual({
      event: "generate_lead_success",
      form_name: "diagnostico_gratuito",
      lead_source: "website",
      solution_interest: "Automações com IA",
      company_size: "11-50 colaboradores",
      company_segment: segment,
    });
    expect(Object.keys(event)).not.toEqual(
      expect.arrayContaining(["name", "email", "phone", "whatsapp", "message", "ip"])
    );
  });
});
