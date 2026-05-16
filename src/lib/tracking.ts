"use client";

export type DataLayerValue = string | number | boolean | null | undefined;
export type DataLayerPayload = Record<string, DataLayerValue>;

export type LeadEventName =
  | "generate_lead_start"
  | "generate_lead_step_1"
  | "generate_lead_submit"
  | "generate_lead_success";

export type DataLayerEventName =
  | "page_view"
  | "cta_click"
  | "whatsapp_click"
  | LeadEventName
  | (string & {});

export interface PageViewPayload extends DataLayerPayload {
  page_path: string;
  page_location: string;
  page_title: string;
}

export interface CtaClickPayload extends DataLayerPayload {
  location: string;
  label: string;
  destination: string;
}

export interface WhatsappClickPayload extends DataLayerPayload {
  location: string;
  label: string;
  destination: string;
}

export interface LeadEventPayload extends DataLayerPayload {
  form_name?: "diagnostico_gratuito";
  lead_source?: "website";
  solution_interest?: string;
  company_size?: string;
  company_segment?: string;
}

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

function pushDataLayer(event: DataLayerEventName, payload: DataLayerPayload = {}) {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({
    event,
    ...payload,
  });
}

export function trackEvent(event: string, payload: DataLayerPayload = {}) {
  pushDataLayer(event, payload);
}

export function trackPageView(payload: PageViewPayload) {
  pushDataLayer("page_view", payload);
}

export function trackCtaClick(payload: CtaClickPayload) {
  pushDataLayer("cta_click", payload);
}

export function trackWhatsappClick(payload: WhatsappClickPayload) {
  pushDataLayer("whatsapp_click", payload);
}

export function trackLeadEvent(eventName: LeadEventName, payload: LeadEventPayload = {}) {
  pushDataLayer(eventName, payload);
}
