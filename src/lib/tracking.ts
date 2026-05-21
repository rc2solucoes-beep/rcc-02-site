"use client";

export type DataLayerValue = string | number | boolean | null | undefined;
export type DataLayerPayload = Record<string, DataLayerValue>;
export type CompanySegmentCategory =
  | "varejo"
  | "saude"
  | "logistica"
  | "servicos"
  | "educacao"
  | "industria"
  | "tecnologia"
  | "financeiro"
  | "alimentacao"
  | "outro";

export type LeadEventName =
  | "generate_lead_start"
  | "generate_lead_step_1"
  | "generate_lead_submit"
  | "generate_lead_success";

export type FormEventName = "form_start" | "form_submit" | "form_success" | "form_error";
export type LinkEventName = "service_link_click" | "solution_link_click" | "related_link_click";
export type ShareEventName = "blog_share_click";

export type DataLayerEventName =
  | "page_view"
  | "cta_click"
  | "whatsapp_click"
  | FormEventName
  | LinkEventName
  | ShareEventName
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
  company_segment?: CompanySegmentCategory;
}

export interface FormEventPayload extends DataLayerPayload {
  form_name: "diagnostico_gratuito";
  location: string;
  source_page: string;
  source_type: string;
  solution_interest?: string;
  company_size?: string;
  company_segment?: CompanySegmentCategory;
  error_code?: string;
  error_message?: string;
}

export interface LinkClickPayload extends DataLayerPayload {
  location: string;
  label: string;
  destination: string;
  source_page: string;
  source_type: string;
}

export interface BlogSharePayload extends DataLayerPayload {
  location: string;
  destination: string;
  source_page: string;
  source_type: string;
  post_slug: string;
  network: "linkedin" | "whatsapp" | "x";
  label?: string;
}

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

function pushLegacyDataLayer(event: string, payload: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({
    event,
    ...payload,
  });
}

function pushFixedDataLayer(event: DataLayerEventName, payload: DataLayerPayload = {}) {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({
    ...payload,
    event,
  });
}

export function trackEvent(event: string, payload: Record<string, unknown> = {}) {
  pushLegacyDataLayer(event, payload);
}

export function trackPageView(payload: PageViewPayload) {
  pushFixedDataLayer("page_view", payload);
}

export function trackCtaClick(payload: CtaClickPayload) {
  pushFixedDataLayer("cta_click", payload);
}

export function trackWhatsappClick(payload: WhatsappClickPayload) {
  pushFixedDataLayer("whatsapp_click", payload);
}

export function trackLeadEvent(eventName: LeadEventName, payload: LeadEventPayload = {}) {
  pushFixedDataLayer(eventName, payload);
}

export function trackFormStart(payload: FormEventPayload) {
  pushFixedDataLayer("form_start", payload);
}

export function trackFormSubmit(payload: FormEventPayload) {
  pushFixedDataLayer("form_submit", payload);
}

export function trackFormSuccess(payload: FormEventPayload) {
  pushFixedDataLayer("form_success", payload);
}

export function trackFormError(payload: FormEventPayload) {
  pushFixedDataLayer("form_error", payload);
}

export function trackServiceLinkClick(payload: LinkClickPayload) {
  pushFixedDataLayer("service_link_click", payload);
}

export function trackSolutionLinkClick(payload: LinkClickPayload) {
  pushFixedDataLayer("solution_link_click", payload);
}

export function trackRelatedLinkClick(payload: LinkClickPayload) {
  pushFixedDataLayer("related_link_click", payload);
}

export function trackBlogShareClick(payload: BlogSharePayload) {
  pushFixedDataLayer("blog_share_click", payload);
}
