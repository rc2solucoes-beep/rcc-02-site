"use client";

import { useEffect } from "react";

interface DelayedGtmProps {
  gtmId: string;
}

const FALLBACK_TIMEOUT_MS = 2500;
const ENGAGEMENT_EVENTS: Array<keyof WindowEventMap> = [
  "scroll",
  "pointerdown",
  "keydown",
  "touchstart",
];

export function DelayedGtm({ gtmId }: DelayedGtmProps) {
  useEffect(() => {
    if (document.querySelector(`script[src*="googletagmanager.com/gtm.js?id=${gtmId}"]`)) {
      return;
    }

    let loaded = false;
    let fallbackTimer: number | undefined;

    const startFallback = () => {
      fallbackTimer = window.setTimeout(loadGtm, FALLBACK_TIMEOUT_MS);
    };

    const loadGtm = () => {
      if (loaded) return;
      loaded = true;

      if (fallbackTimer) window.clearTimeout(fallbackTimer);
      window.removeEventListener("load", startFallback);

      for (const eventName of ENGAGEMENT_EVENTS) {
        window.removeEventListener(eventName, loadGtm);
      }

      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        "gtm.start": new Date().getTime(),
        event: "gtm.js",
      });

      const firstScript = document.getElementsByTagName("script")[0];
      const gtmScript = document.createElement("script");
      gtmScript.async = true;
      gtmScript.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
      firstScript.parentNode?.insertBefore(gtmScript, firstScript);
    };

    for (const eventName of ENGAGEMENT_EVENTS) {
      window.addEventListener(eventName, loadGtm, { once: true, passive: true });
    }

    if (document.readyState === "complete") {
      startFallback();
    } else {
      window.addEventListener("load", startFallback, { once: true });
    }

    return () => {
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
      window.removeEventListener("load", startFallback);

      for (const eventName of ENGAGEMENT_EVENTS) {
        window.removeEventListener(eventName, loadGtm);
      }
    };
  }, [gtmId]);

  return null;
}
