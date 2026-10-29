import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("root layout consent ordering", () => {
  const rootSource = readFileSync(resolve(process.cwd(), "src/app/layout.tsx"), "utf8");
  // Os rastreadores saíram do layout raiz para <TrackingScripts /> (DEC-27 / PRP-10, opção O5).
  const source = readFileSync(resolve(process.cwd(), "src/components/tracking/TrackingScripts.tsx"), "utf8");

  it("keeps trackers out of the root layout", () => {
    for (const tracker of ["DelayedGtm", "PageViewTracker", "getConsentBootstrapScript", "TrackingScripts"]) {
      expect(rootSource).not.toContain(tracker);
    }
  });

  it("places synchronous consent bootstrap before the delayed GTM loader", () => {
    const bootstrap = source.indexOf("getConsentBootstrapScript()");
    const loader = source.indexOf("<DelayedGtm");
    expect(bootstrap).toBeGreaterThan(-1);
    expect(loader).toBeGreaterThan(bootstrap);
    expect(source).not.toContain("<noscript>");
  });

  it("mounts the preference manager and provides a persistent footer control", () => {
    const footer = readFileSync(resolve(process.cwd(), "src/components/layout/Footer.tsx"), "utf8");
    const publicLayout = readFileSync(resolve(process.cwd(), "src/app/(public)/layout.tsx"), "utf8");
    expect(publicLayout).toContain("<ConsentManager />");
    expect(source).not.toContain("<ConsentManager />");
    expect(rootSource).not.toContain("<ConsentManager />");
    expect(publicLayout).toContain("<TrackingScripts />");
    expect(footer).toContain("<ConsentPreferencesButton />");
  });
});
