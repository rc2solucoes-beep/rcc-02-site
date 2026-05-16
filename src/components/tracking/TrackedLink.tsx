"use client";

import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";
import { trackCtaClick, trackWhatsappClick } from "@/lib/tracking";

type TrackingKind = "cta" | "whatsapp";

type TrackedLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps | "onClick"> & {
    children: ReactNode;
    tracking: {
      kind: TrackingKind;
      location: string;
      label: string;
      destination?: string;
    };
    onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  };

function queryToString(query: NonNullable<Extract<LinkProps["href"], object>["query"]>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue;

    if (Array.isArray(value)) {
      for (const item of value) {
        searchParams.append(key, String(item));
      }
    } else {
      searchParams.set(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

function hrefToString(href: LinkProps["href"]) {
  if (typeof href === "string") return href;

  const pathname = href.pathname ?? "";
  const query = href.query ? queryToString(href.query) : "";
  const hash = href.hash ? `#${href.hash.replace(/^#/, "")}` : "";

  return `${pathname}${query}${hash}`;
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
        if (tracking.kind === "whatsapp") {
          trackWhatsappClick({
            location: tracking.location,
            label: tracking.label,
            destination,
          });
        } else {
          trackCtaClick({
            location: tracking.location,
            label: tracking.label,
            destination,
          });
        }

        onClick?.(event);
      }}
      {...props}
    >
      {children}
    </Link>
  );
}
