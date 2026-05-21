"use client";

import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";
import {
  trackBlogShareClick,
  trackCtaClick,
  trackRelatedLinkClick,
  trackServiceLinkClick,
  trackSolutionLinkClick,
  trackWhatsappClick,
} from "@/lib/tracking";

type TrackingKind =
  | "cta"
  | "whatsapp"
  | "service_link"
  | "solution_link"
  | "related_link"
  | "blog_share";

type TrackedLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps | "onClick"> & {
    children: ReactNode;
    tracking: {
      kind: TrackingKind;
      location: string;
      label: string;
      destination?: string;
      source_page?: string;
      source_type?: string;
      post_slug?: string;
      network?: "linkedin" | "whatsapp" | "x";
    };
    onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  };

type LinkHrefObject = Exclude<LinkProps["href"], string>;
type LinkQuery = LinkHrefObject["query"];

function normalizeSearch(search: string) {
  if (!search) return "";
  return search.startsWith("?") ? search : `?${search}`;
}

function queryToString(query: LinkQuery) {
  if (!query) return "";
  if (typeof query === "string") return normalizeSearch(query);

  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === undefined || item === null) continue;
        searchParams.append(key, String(item));
      }
    } else {
      searchParams.set(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

function hostToString(href: LinkHrefObject) {
  if (href.host) return href.host;
  if (!href.hostname) return "";

  const auth = href.auth ? `${href.auth}@` : "";
  const port = href.port ? `:${href.port}` : "";

  return `${auth}${href.hostname}${port}`;
}

function hrefToString(href: LinkProps["href"]) {
  if (typeof href === "string") return href;

  const protocol = href.protocol
    ? href.protocol.endsWith(":")
      ? href.protocol
      : `${href.protocol}:`
    : "";
  const host = hostToString(href);
  const slashes = host ? "//" : "";
  const pathname = href.pathname ?? "";
  const search = href.search ? normalizeSearch(href.search) : queryToString(href.query);
  const hash = href.hash ? `#${href.hash.replace(/^#/, "")}` : "";

  return `${protocol}${slashes}${host}${pathname}${search}${hash}`;
}

export function TrackedLink({
  children,
  tracking,
  href,
  onClick,
  ...props
}: TrackedLinkProps) {
  const destination = tracking.destination ?? hrefToString(href);

  return (
    <Link
      href={href}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;

        if (tracking.kind === "whatsapp") {
          trackWhatsappClick({
            location: tracking.location,
            label: tracking.label,
            destination,
          });
          return;
        }

        if (tracking.kind === "service_link") {
          trackServiceLinkClick({
            location: tracking.location,
            label: tracking.label,
            destination,
            source_page: tracking.source_page ?? "",
            source_type: tracking.source_type ?? "",
          });
          return;
        }

        if (tracking.kind === "solution_link") {
          trackSolutionLinkClick({
            location: tracking.location,
            label: tracking.label,
            destination,
            source_page: tracking.source_page ?? "",
            source_type: tracking.source_type ?? "",
          });
          return;
        }

        if (tracking.kind === "related_link") {
          trackRelatedLinkClick({
            location: tracking.location,
            label: tracking.label,
            destination,
            source_page: tracking.source_page ?? "",
            source_type: tracking.source_type ?? "",
          });
          return;
        }

        if (tracking.kind === "blog_share") {
          trackBlogShareClick({
            location: tracking.location,
            label: tracking.label,
            destination,
            source_page: tracking.source_page ?? "",
            source_type: tracking.source_type ?? "",
            post_slug: tracking.post_slug ?? "",
            network: tracking.network ?? "x",
          });
          return;
        }

        {
          trackCtaClick({
            location: tracking.location,
            label: tracking.label,
            destination,
          });
        }
      }}
      {...props}
    >
      {children}
    </Link>
  );
}
