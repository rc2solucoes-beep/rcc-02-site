import { createElement } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { ConsentManager, ConsentPreferencesButton } from "@/components/tracking/ConsentManager";
import { CONSENT_STORAGE_KEY, parseConsentPreference } from "@/lib/consent";

describe("ConsentManager", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.dataLayer = [];
    delete window.gtag;
  });

  it("offers clear accept, reject and configure actions without blocking content", async () => {
    render(createElement(ConsentManager));
    expect(await screen.findByText("Preferências de cookies")).toBeVisible();
    const accept = screen.getByRole("button", { name: "Aceitar todos" });
    const reject = screen.getByRole("button", { name: "Rejeitar opcionais" });
    expect(accept).toBeVisible();
    expect(reject).toBeVisible();
    expect(accept.className).toBe(reject.className);
    expect(screen.getByRole("button", { name: "Configurar" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Política de Privacidade" })).toHaveAttribute("href", "/privacidade");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("accepts all categories, updates Consent Mode and persists the choice", async () => {
    const user = userEvent.setup();
    render(createElement(ConsentManager));
    await user.click(await screen.findByRole("button", { name: "Aceitar todos" }));
    expect(parseConsentPreference(window.localStorage.getItem(CONSENT_STORAGE_KEY))).toMatchObject({ analytics: true, marketing: true });
    expect(window.dataLayer?.[1]).toEqual({ event: "consent_update", analytics_consent: "granted", marketing_consent: "granted" });
    expect(screen.queryByText("Preferências de cookies")).not.toBeInTheDocument();
  });

  it("rejects optional categories and persists denied values", async () => {
    const user = userEvent.setup();
    render(createElement(ConsentManager));
    await user.click(await screen.findByRole("button", { name: "Rejeitar opcionais" }));
    expect(parseConsentPreference(window.localStorage.getItem(CONSENT_STORAGE_KEY))).toMatchObject({ analytics: false, marketing: false });
    expect(window.dataLayer?.[1]).toEqual({ event: "consent_update", analytics_consent: "denied", marketing_consent: "denied" });
  });

  it("saves independent Analytics and Marketing preferences", async () => {
    const user = userEvent.setup();
    render(createElement(ConsentManager));
    await user.click(await screen.findByRole("button", { name: "Configurar" }));
    expect(screen.getByText("Essenciais")).toBeVisible();
    await user.click(screen.getByRole("checkbox", { name: "Analytics" }));
    await user.click(screen.getByRole("button", { name: "Salvar preferências" }));
    expect(parseConsentPreference(window.localStorage.getItem(CONSENT_STORAGE_KEY))).toMatchObject({ analytics: true, marketing: false });
    expect(window.dataLayer?.[1]).toEqual({ event: "consent_update", analytics_consent: "granted", marketing_consent: "denied" });
  });

  it("hides the first-visit banner for a saved choice and reopens from the footer", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ version: 1, analytics: true, marketing: false, updatedAt: "2026-10-01T00:00:00.000Z" }));
    render(createElement("div", null, createElement(ConsentManager), createElement(ConsentPreferencesButton)));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Aceitar todos" })).not.toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "Preferências de cookies" }));
    expect(await screen.findByRole("checkbox", { name: "Analytics" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Marketing" })).not.toBeChecked();
    await user.click(screen.getByRole("button", { name: "Fechar preferências" }));
    expect(screen.queryByRole("checkbox", { name: "Analytics" })).not.toBeInTheDocument();
  });
});
