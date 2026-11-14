"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
type Entry = { animation: Animation };

/** Animate individual public-page elements as they enter the viewport. */
export function ScrollParallax() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/api") || new URLSearchParams(window.location.search).get("preview") === "1") return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let setupFrame = 0;
    let discoveryFrame = 0;
    let observer: IntersectionObserver | undefined;
    let mutationObserver: MutationObserver | undefined;
    const entries = new Map<HTMLElement, Entry>();
    const heroAnimations = new Set<Animation>();
    let heroStarted = false;
    let heroRoot: HTMLElement | null = null;
    let registered = new WeakSet<HTMLElement>();

    // Web Animations do not change DOM attributes, so streamed sections can
    // hydrate while the root effect is already running.
    const clear = (entry: Entry) => entry.animation.cancel();
    const stop = () => { observer?.disconnect(); observer = undefined; mutationObserver?.disconnect(); mutationObserver = undefined; if (discoveryFrame) cancelAnimationFrame(discoveryFrame); discoveryFrame = 0; entries.forEach(clear); entries.clear(); heroAnimations.forEach((animation) => animation.cancel()); heroAnimations.clear(); heroStarted = false; heroRoot = null; registered = new WeakSet(); };
    const discover = () => {
      discoveryFrame = 0;
      if (!heroStarted && pathname !== "/") {
        const key = `hero-entrance:${pathname}`;
        let seen = false;
        try { seen = sessionStorage.getItem(key) === "1"; } catch { /* Storage may be unavailable. */ }
        const heading = document.querySelector<HTMLElement>("h1");
        if (seen) heroStarted = true;
        else if (heading && heading.getBoundingClientRect().top < window.innerHeight) {
          const parent = heading.parentElement;
          heroRoot = heading.closest<HTMLElement>('section[class*="hero"], header[class*="hero"]');
          const elements = heroRoot ? [heroRoot] : parent?.matches("main")
            ? [heading.previousElementSibling, heading, heading.nextElementSibling].filter((element): element is HTMLElement => element instanceof HTMLElement)
            : parent ? [parent] : [heading];
          heroStarted = true;
          elements.forEach((element, index) => {
            const animation = element.animate([{ translate: "0 64px", opacity: 0.72 }, { translate: "0 0", opacity: 1 }], { duration: 1000, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "both" });
            heroAnimations.add(animation);
            animation.onfinish = () => {
              animation.cancel();
              heroAnimations.delete(animation);
              if (index === elements.length - 1) { try { sessionStorage.setItem(key, "1"); } catch { /* Storage may be unavailable. */ } }
            };
          });
        }
      }
      for (const [target, entry] of entries) {
        if (!target.isConnected) { clear(entry); observer?.unobserve(target); entries.delete(target); }
      }
      const roots = document.querySelectorAll<HTMLElement>("main, section#how-i-work");
      const targets: HTMLElement[] = [];
      const collect = (node: HTMLElement) => {
        if (heroRoot === node) return;
        if (node.hidden || node.getAttribute("aria-hidden") === "true" || node.hasAttribute("inert") || node.matches("script, style, template, svg, canvas, iframe, footer, nav")) return;
        if (node.matches("aside") && ["sticky", "fixed"].includes(getComputedStyle(node).position)) return;
        const story = node.matches('article[class*="articleBody"]');
        const card = node.matches("article") && !story;
        const linkedCard = node.matches("a") && Boolean(node.querySelector("h1, h2, h3, h4, p, img, picture"));
        const sectionHeader = node.matches("header") && Boolean(node.querySelector("h1, h2, h3, h4, h5, h6")) && !node.querySelector("article, section");
        const textGroup = node.matches("div") && Boolean(node.querySelector(":scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6")) && Boolean(node.querySelector(":scope > p")) && !node.querySelector("article, section, form, ul, ol, figure");
        if (card || linkedCard || sectionHeader || textGroup || node.matches("h1, h2, h3, h4, h5, h6, p, li, figure, blockquote, form, img, button, .label-eyebrow") || (node.matches("a") && Boolean(node.textContent?.trim()))) {
          targets.push(node);
          return;
        }
        Array.from(node.children).forEach((child) => { if (child instanceof HTMLElement) collect(child); });
      };
      roots.forEach((root) => collect(root));
      targets.forEach((target, index) => {
        if (registered.has(target) || target.getClientRects().length === 0 || target.getBoundingClientRect().top <= window.innerHeight || typeof target.animate !== "function") return;
        registered.add(target);
        const stagger = index % 4;
        const distance = 112 + stagger * 12;
        const animation = target.animate([{ translate: `0 ${distance}px`, opacity: 0.72 }, { translate: "0 0", opacity: 1 }], { duration: 1000, delay: stagger * 80, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "both" });
        animation.pause();
        animation.currentTime = 0;
        const entry = { animation };
        entries.set(target, entry);
        observer?.observe(target);
      });
    };
    const start = () => {
      stop();
      if (motion.matches || !("IntersectionObserver" in window)) return;
      observer = new IntersectionObserver((observed) => {
        observed.forEach((item) => {
          const target = item.target as HTMLElement;
          const entry = entries.get(target);
          if (!entry || !item.isIntersecting) return;
          observer?.unobserve(target);
          entry.animation.onfinish = () => { clear(entry); entries.delete(target); };
          entry.animation.play();
        });
      });
      discover();
      mutationObserver = new MutationObserver(() => { if (!discoveryFrame) discoveryFrame = requestAnimationFrame(discover); });
      mutationObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden", "aria-hidden", "inert"] });
    };
    setupFrame = requestAnimationFrame(start);
    motion.addEventListener("change", start);
    return () => { cancelAnimationFrame(setupFrame); motion.removeEventListener("change", start); stop(); };
  }, [pathname]);
  return null;
}
