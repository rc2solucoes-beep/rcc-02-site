import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("root layout consent ordering", () => {
  const source = readFileSync(resolve(process.cwd(), "src/app/layout.tsx"), "utf8");

  it("places synchronous consent bootstrap before the delayed GTM loader", () => {
    const bootstrap = source.indexOf("getConsentBootstrapScript()");
    const loader = source.indexOf("<DelayedGtm");
    expect(bootstrap).toBeGreaterThan(-1);
    expect(loader).toBeGreaterThan(bootstrap);
    expect(source).not.toContain("<noscript>");
  });
});
