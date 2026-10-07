import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";

const rules = await nextConfig.headers!();
const policy = rules.flatMap((rule) => rule.headers ?? []).find((header) => header.key === "Content-Security-Policy")?.value ?? "";
const directive = (name: string) => policy.split("; ").find((part) => part.startsWith(`${name} `)) ?? "";

describe("Ads CSP", () => {
  it("allows confirmed and documented Google Ads hosts without a broad connect wildcard", () => {
    const connect = directive("connect-src");
    for (const host of [
      "https://ad.doubleclick.net",
      "https://www.googleadservices.com",
      "https://googleads.g.doubleclick.net",
      "https://pagead2.googlesyndication.com",
    ]) {
      expect(connect.split(" ")).toContain(host);
    }
    expect(connect.split(" ")).not.toContain("https:");
    expect(connect).toContain("https://challenges.cloudflare.com");
    expect(connect).toContain("https://*.supabase.co");
  });

  it("retains GTM/GA4 and permits the documented Ads script and frame hosts", () => {
    expect(directive("script-src")).toContain("https://www.googleadservices.com");
    expect(directive("script-src")).toContain("https://www.google.com");
    expect(directive("frame-src")).toContain("https://www.googletagmanager.com");
    expect(directive("script-src")).toContain("https://www.googletagmanager.com");
  });

  it("allows the observed Ahrefs script and event endpoint only where needed", () => {
    const host = "https://analytics.ahrefs.com";
    expect(directive("script-src").split(" ")).toContain(host);
    expect(directive("connect-src").split(" ")).toContain(host);
    for (const part of policy.split("; ").filter((item) => !item.startsWith("script-src ") && !item.startsWith("connect-src "))) {
      expect(part.split(" ")).not.toContain(host);
    }
  });

  it("allows the observed GA4 endpoint only in connect-src", () => {
    const host = "https://analytics.google.com";
    expect(directive("connect-src").split(" ")).toContain(host);
    for (const part of policy.split("; ").filter((item) => !item.startsWith("connect-src "))) {
      expect(part.split(" ")).not.toContain(host);
    }
  });
});
