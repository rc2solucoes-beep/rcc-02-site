"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackPageView } from "@/lib/tracking";

const TITLE_FALLBACK_MS = 5000;

export function PageViewTracker() {
  const pathname = usePathname();
  const routeRef = useRef<{ pathname: string; id: number } | null>(null);
  const sentRouteIdRef = useRef<number | null>(null);
  const lastSentTitleRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;

    if (routeRef.current?.pathname !== pathname) {
      routeRef.current = { pathname, id: (routeRef.current?.id ?? 0) + 1 };
    }
    const routeId = routeRef.current.id;
    if (sentRouteIdRef.current === routeId) return;

    let observer: MutationObserver | null = null;
    let fallback: ReturnType<typeof setTimeout> | null = null;
    const sendPageView = () => {
      if (sentRouteIdRef.current === routeId || routeRef.current?.id !== routeId) return;
      sentRouteIdRef.current = routeId;
      lastSentTitleRef.current = document.title;
      observer?.disconnect();
      if (fallback !== null) clearTimeout(fallback);
      trackPageView({
        page_path: pathname,
        page_location: `${window.location.origin}${pathname}`,
        page_title: document.title,
      });
    };

    if (routeId === 1) {
      sendPageView();
    } else {
      const previousTitle = lastSentTitleRef.current;
      if (document.title && document.title !== previousTitle) {
        sendPageView();
      } else {
        observer = new MutationObserver(() => {
          if (document.title && document.title !== previousTitle) sendPageView();
        });
        observer.observe(document.documentElement, { childList: true, characterData: true, subtree: true });
        // A route can legitimately keep the same title, so observation has a bounded fallback.
        fallback = setTimeout(sendPageView, TITLE_FALLBACK_MS);
      }
    }

    return () => {
      observer?.disconnect();
      if (fallback !== null) clearTimeout(fallback);
    };
  }, [pathname]);

  return null;
}
