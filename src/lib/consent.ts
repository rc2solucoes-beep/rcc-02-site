export const CONSENT_STORAGE_KEY = "rc2.consent.v1";

export type ConsentPreference = {
  version: 1;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
};

export type ConsentState = {
  analytics_storage: "granted" | "denied";
  ad_storage: "granted" | "denied";
  ad_user_data: "granted" | "denied";
  ad_personalization: "granted" | "denied";
};

declare global {
  interface Window {
    gtag?: (command: "consent", action: "default" | "update", state: ConsentState) => void;
  }
}

export function parseConsentPreference(raw: string | null): ConsentPreference | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const record = value as Record<string, unknown>;
    if (record.version !== 1 || typeof record.analytics !== "boolean" ||
        typeof record.marketing !== "boolean" || typeof record.updatedAt !== "string" ||
        !Number.isFinite(Date.parse(record.updatedAt))) return null;
    return {
      version: 1,
      analytics: record.analytics,
      marketing: record.marketing,
      updatedAt: record.updatedAt,
    };
  } catch {
    return null;
  }
}

export function readConsentPreference(): ConsentPreference | null {
  try {
    return parseConsentPreference(window.localStorage.getItem(CONSENT_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function toConsentState(preference: Pick<ConsentPreference, "analytics" | "marketing">): ConsentState {
  const marketing = preference.marketing ? "granted" : "denied";
  return {
    analytics_storage: preference.analytics ? "granted" : "denied",
    ad_storage: marketing,
    ad_user_data: marketing,
    ad_personalization: marketing,
  };
}

/** Runs synchronously before GTM, including on visits with a saved preference. */
export function getConsentBootstrapScript(): string {
  return `(function(){
    var layer=window.dataLayer=window.dataLayer||[];
    window.gtag=function(...args){layer.push(args);};
    var analytics=false,marketing=false;
    try {
      var raw=window.localStorage.getItem(${JSON.stringify(CONSENT_STORAGE_KEY)});
      if(raw){
        var saved=JSON.parse(raw);
        if(saved && !Array.isArray(saved) && saved.version===1 &&
           typeof saved.analytics==='boolean' && typeof saved.marketing==='boolean' &&
           typeof saved.updatedAt==='string' && !Number.isNaN(Date.parse(saved.updatedAt))){
          analytics=saved.analytics;marketing=saved.marketing;
        }
      }
    }catch(error){}
    var ad=marketing?'granted':'denied';
    window.gtag('consent','default',{
      analytics_storage:analytics?'granted':'denied',
      ad_storage:ad,ad_user_data:ad,ad_personalization:ad
    });
  })();`;
}

export function saveConsentPreference(analytics: boolean, marketing: boolean): ConsentPreference {
  const preference: ConsentPreference = {
    version: 1,
    analytics,
    marketing,
    updatedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(preference));
  } catch {
    // The current-page choice still applies when browser storage is unavailable.
  }
  return preference;
}

export function publishConsentUpdate(preference: ConsentPreference): void {
  window.dataLayer = window.dataLayer ?? [];
  const state = toConsentState(preference);
  if (!window.gtag) {
    window.gtag = function (...args) {
      (window.dataLayer as unknown as unknown[]).push(args);
    };
  }
  window.gtag("consent", "update", state);
  window.dataLayer.push({
    event: "consent_update",
    analytics_consent: state.analytics_storage,
    marketing_consent: state.ad_storage,
  });
}
