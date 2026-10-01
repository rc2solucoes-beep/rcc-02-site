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

  it("mounts the preference manager and provides a persistent footer control", () => {
    const footer = readFileSync(resolve(process.cwd(), "src/components/layout/Footer.tsx"), "utf8");
    expect(source).toContain("<ConsentManager />");
    expect(footer).toContain("<ConsentPreferencesButton />");
  });
});
