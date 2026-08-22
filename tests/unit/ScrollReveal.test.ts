import React from "react";
import { renderToString } from "react-dom/server";
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

type ObserverEntry = { isIntersecting: boolean; intersectionRatio?: number };

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  callback: IntersectionObserverCallback;
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    MockIntersectionObserver.instances.push(this);
  }

  trigger(entry: ObserverEntry) {
    this.callback(
      [
        {
          isIntersecting: entry.isIntersecting,
          intersectionRatio: entry.intersectionRatio ?? (entry.isIntersecting ? 1 : 0),
        } as IntersectionObserverEntry,
      ],
      this as unknown as IntersectionObserver
    );
  }
}

describe("ScrollReveal", () => {
  const originalIntersectionObserver = globalThis.IntersectionObserver;
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    MockIntersectionObserver.instances = [];
    globalThis.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    globalThis.IntersectionObserver = originalIntersectionObserver;
    window.matchMedia = originalMatchMedia;
  });

  it("renders visible by default before JavaScript applies the reveal state", () => {
    const html = renderToString(React.createElement(ScrollReveal, null, "Conteúdo"));

    expect(html).toContain('data-reveal-state="visible"');
  });

  it("marks the element visible when it intersects and disconnects when once is true", async () => {
    render(React.createElement(ScrollReveal, null, "Conteúdo"));

    await act(async () => {});

    const element = screen.getByText("Conteúdo");
    expect(element).toHaveAttribute("data-reveal-state", "hidden");

    await act(async () => {
      MockIntersectionObserver.instances[0].trigger({ isIntersecting: true });
    });

    expect(element).toHaveAttribute("data-reveal-state", "visible");
    expect(MockIntersectionObserver.instances[0].disconnect).toHaveBeenCalled();
  });

  it("does not hide content when reduced motion is preferred", async () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    render(React.createElement(ScrollReveal, null, "Conteúdo"));

    await act(async () => {});

    expect(screen.getByText("Conteúdo")).toHaveAttribute("data-reveal-state", "visible");
    expect(MockIntersectionObserver.instances).toHaveLength(0);
  });
});
