import { beforeEach, describe, expect, it } from "vitest";
import {
  CONSENT_STORAGE_KEY,
  getConsentBootstrapScript,
  parseConsentPreference,
  publishConsentUpdate,
  saveConsentPreference,
  toConsentState,
} from "@/lib/consent";

type FakeWindow = {
  dataLayer?: unknown[];
  localStorage: Pick<Storage, "getItem">;
  gtag?: (...args: unknown[]) => void;
};

function bootstrap(raw: string | null, storageThrows = false): FakeWindow {
  const target: FakeWindow = {
    localStorage: {
      getItem: (key) => {
        expect(key).toBe(CONSENT_STORAGE_KEY);
        if (storageThrows) throw new Error("storage blocked");
        return raw;
      },
    },
  };
  new Function("window", getConsentBootstrapScript())(target);
  return target;
}

const denied = {
  analytics_storage: "denied",
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
};

describe("consent foundation", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.dataLayer = [];
    delete window.gtag;
  });

  it("sets explicit denied defaults before GTM on the first visit", () => {
    const target = bootstrap(null);
    expect(Object.prototype.toString.call(target.dataLayer?.[0])).toBe("[object Arguments]");
    expect(Array.isArray(target.dataLayer?.[0])).toBe(false);
    expect(Array.from(target.dataLayer?.[0] as ArrayLike<unknown>)).toEqual(["consent", "default", denied]);
    expect(target.dataLayer).toHaveLength(1);
  });

  it("restores a saved choice synchronously before GTM", () => {
    const saved = JSON.stringify({ version: 1, analytics: true, marketing: false, updatedAt: "2026-10-01T00:00:00.000Z" });
    const target = bootstrap(saved);
    expect(Array.from(target.dataLayer?.[0] as ArrayLike<unknown>)).toEqual([
      "consent", "default", { ...denied, analytics_storage: "granted" },
    ]);
  });

  it("denies optional storage when saved data is invalid or unavailable", () => {
    for (const raw of ["{broken", JSON.stringify({ version: 2, analytics: true, marketing: true, updatedAt: "2026-10-01T00:00:00.000Z" }), JSON.stringify({ version: 1, analytics: true })]) {
      expect(Array.from(bootstrap(raw).dataLayer?.[0] as ArrayLike<unknown>)[2]).toEqual(denied);
      expect(parseConsentPreference(raw)).toBeNull();
    }
    expect(Array.from(bootstrap(null, true).dataLayer?.[0] as ArrayLike<unknown>)[2]).toEqual(denied);
  });

  it("maps accept all and reject optional categories", () => {
    expect(toConsentState({ analytics: true, marketing: true })).toEqual({
      analytics_storage: "granted", ad_storage: "granted", ad_user_data: "granted", ad_personalization: "granted",
    });
    expect(toConsentState({ analytics: false, marketing: false })).toEqual(denied);
  });

  it("maps granular Analytics on and Marketing off", () => {
    expect(toConsentState({ analytics: true, marketing: false })).toEqual({ ...denied, analytics_storage: "granted" });
  });

  it("persists a versioned choice with no identifier", () => {
    const preference = saveConsentPreference(true, false);
    expect(preference).toMatchObject({ version: 1, analytics: true, marketing: false });
    expect(Number.isNaN(Date.parse(preference.updatedAt))).toBe(false);
    expect(parseConsentPreference(window.localStorage.getItem(CONSENT_STORAGE_KEY))).toEqual(preference);
  });

  it("publishes a consent update and a two-field event without PII", () => {
    const preference = { version: 1 as const, analytics: true, marketing: false, updatedAt: "2026-10-01T00:00:00.000Z" };
    publishConsentUpdate(preference);
    expect(Object.prototype.toString.call(window.dataLayer?.[0])).toBe("[object Arguments]");
    expect(Array.isArray(window.dataLayer?.[0])).toBe(false);
    expect(Array.from(window.dataLayer?.[0] as unknown as ArrayLike<unknown>)).toEqual([
      "consent", "update", { ...denied, analytics_storage: "granted" },
    ]);
    expect(window.dataLayer?.[1]).toEqual({
      event: "consent_update", analytics_consent: "granted", marketing_consent: "denied",
    });
  });
});
