import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/contact/route";

const previewHost = "rcc-02-site-git-fix-tracking-example.vercel.app";

async function responseStatus(origin: string | null): Promise<number> {
  const headers = new Headers();
  if (origin !== null) headers.set("origin", origin);
  const request = new NextRequest("https://www.rc2solucoes.com.br/api/contact", {
    method: "POST",
    headers,
    body: "{",
  });
  return (await POST(request)).status;
}

describe("contact CSRF origin", () => {
  afterEach(() => vi.unstubAllEnvs());

  it.each(["rc2solucoes.com.br", "www.rc2solucoes.com.br"])(
    "accepts the existing production hostname %s",
    async (hostname) => {
      vi.stubEnv("VERCEL_ENV", "production");
      vi.stubEnv("VERCEL_URL", previewHost);
      expect(await responseStatus(`https://${hostname}`)).toBe(400);
    },
  );

  it("rejects the deployment hostname in production", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_URL", previewHost);
    expect(await responseStatus(`https://${previewHost}`)).toBe(403);
  });

  it.each(["localhost", "127.0.0.1"])(
    "preserves the existing local hostname %s",
    async (hostname) => {
      vi.stubEnv("VERCEL_ENV", "production");
      expect(await responseStatus(`http://${hostname}:3000`)).toBe(400);
    },
  );

  it("accepts exactly the normalized VERCEL_URL hostname in Preview", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_URL", previewHost);
    expect(await responseStatus(`https://${previewHost.toUpperCase()}`)).toBe(400);
  });

  it("rejects another vercel.app hostname in Preview", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_URL", previewHost);
    expect(await responseStatus("https://another-deployment.vercel.app")).toBe(403);
    expect(await responseStatus(`https://${previewHost}.attacker.example`)).toBe(403);
  });

  it("does not enable Preview hostname without VERCEL_URL", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_URL", "");
    expect(await responseStatus(`https://${previewHost}`)).toBe(403);
  });

  it("rejects missing and malformed origins", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_URL", previewHost);
    expect(await responseStatus(null)).toBe(403);
    expect(await responseStatus("not-a-url")).toBe(403);
  });
});
