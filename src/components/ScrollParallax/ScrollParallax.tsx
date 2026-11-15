"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
type Entry = { animation: Animation; companions: Animation[] };

/** Animate individual public-page elements as they enter the viewport. */
export function ScrollParallax() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/api") || new URLSearchParams(window.location.search).get("preview") === "1") return;
    const serviceDetail = pathname.startsWith("/services/");
    const storyDetail = pathname.startsWith("/work/") || pathname.startsWith("/insights/");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let setupFrame = 0;
    let discoveryFrame = 0;
    let observer: IntersectionObserver | undefined;
    let mutationObserver: MutationObserver | undefined;
    const entries = new Map<HTMLElement, Entry>();
    const separators = new Map<HTMLElement, Animation>();
    const heroAnimations = new Set<Animation>();
    let heroStarted = false;
    let heroRoot: HTMLElement | null = null;
    let registered = new WeakSet<HTMLElement>();

    // Web Animations do not change DOM attributes, so streamed sections can
    // hydrate while the root effect is already running.
    const clear = (entry: Entry) => { entry.animation.cancel(); entry.companions.forEach((animation) => animation.cancel()); };
    const stop = () => { observer?.disconnect(); observer = undefined; mutationObserver?.disconnect(); mutationObserver = undefined; if (discoveryFrame) cancelAnimationFrame(discoveryFrame); discoveryFrame = 0; entries.forEach(clear); entries.clear(); separators.forEach((animation) => animation.cancel()); separators.clear(); heroAnimations.forEach((animation) => animation.cancel()); heroAnimations.clear(); heroStarted = false; heroRoot = null; registered = new WeakSet(); };
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
            const animation = element.animate([{ translate: "0 64px", opacity: 0 }, { translate: "0 0", opacity: 1 }], { duration: 1000, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "both" });
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
      const roots = document.querySelectorAll<HTMLElement>("main, section#how-i-work, section#latest_insights");
      const targets: HTMLElement[] = [];
      const chapterGroups = new Map<HTMLElement, HTMLElement[]>();
      const collectStory = (root: HTMLElement) => {
        let chapter: HTMLElement[] = [];
        const flush = () => {
          if (!chapter.length) return;
          targets.push(chapter[0]);
          chapterGroups.set(chapter[0], chapter.slice(1));
          chapter = [];
        };
        const visit = (container: HTMLElement) => {
          Array.from(container.children).forEach((child) => {
            if (!(child instanceof HTMLElement)) return;
            if (child.hasAttribute("data-story-content")) { visit(child); return; }
            const media = child.matches('figure, img, pre, video, iframe, [data-media-container], [data-media-variant], [data-story-code-block], a[class*="RelatedInsightCard"]') || (child.matches("p") && Boolean(child.querySelector("img, video, iframe")));
            if (media) { targets.push(child); return; }
            if (child.matches("h2, h3")) flush();
            if (!child.matches("hr, script, style")) chapter.push(child);
          });
        };
        visit(root);
        flush();
      };
      const collect = (node: HTMLElement) => {
        if (heroRoot === node) return;
        if (storyDetail && node.hasAttribute("data-story-entrance")) { targets.push(node); return; }
        if (node.hidden || node.getAttribute("aria-hidden") === "true" || node.hasAttribute("inert") || node.matches("script, style, template, svg, canvas, iframe, footer, nav")) return;
        if (!storyDetail && node.matches("aside") && ["sticky", "fixed"].includes(getComputedStyle(node).position)) return;
        if (storyDetail && node.hasAttribute("data-story-content")) { collectStory(node); return; }
        if (serviceDetail && node.matches("figure")) return;
        if (pathname === "/" || pathname === "/services") {
          if (node.matches("#value header, #value article, #selected_impact header, #selected_impact a, #selected_impact [data-scroll-group], #latest_insights header, #latest_insights a, #services header, #services a, #approach header, #approach ol > li") || (pathname === "/services" && node.matches("li[data-scroll-group]"))) {
            targets.push(node);
            return;
          }
          Array.from(node.children).forEach((child) => { if (child instanceof HTMLElement) collect(child); });
          return;
        }
        if (pathname === "/about") {
          if (node.matches("section header, section article, #latest_insights a, #how-i-work ol > li")) {
            targets.push(node);
            return;
          }
          Array.from(node.children).forEach((child) => { if (child instanceof HTMLElement) collect(child); });
          return;
        }
        if (pathname === "/work" || pathname === "/insights") {
          if (node.matches("[data-scroll-group], #latest_insights header, #latest_insights a, section[role=status]")) {
            targets.push(node);
            return;
          }
          Array.from(node.children).forEach((child) => { if (child instanceof HTMLElement) collect(child); });
          return;
        }
        if (serviceDetail && node.matches('a[data-service-evidence], div[class*="recognitionCtaInner"]')) {
          targets.push(node);
          return;
        }
        if (storyDetail) {
          if (node.matches('a[data-scroll-group], a[class*="ArticleCard_card"], section[class*="inProgress"], form, header')) { targets.push(node); return; }
          Array.from(node.children).forEach((child) => { if (child instanceof HTMLElement) collect(child); });
          return;
        }
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
      roots.forEach((root) => { if (root.matches("main") || !root.closest("main")) collect(root); });
      targets.forEach((target, index) => {
        if (registered.has(target) || target.getClientRects().length === 0 || target.getBoundingClientRect().top <= window.innerHeight || typeof target.animate !== "function") return;
        registered.add(target);
        const stagger = index % 4;
        const distance = pathname === "/" || pathname === "/about" || pathname === "/services" || pathname === "/work" || pathname === "/insights" || serviceDetail || storyDetail ? 112 : 112 + stagger * 12;
        const options: KeyframeAnimationOptions = { duration: 1000, delay: stagger * 80, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "both" };
        const timelineEntry = pathname === "/about" && target.matches("#before-conscept article");
        const serviceSeparated = serviceDetail && target.children.length > 0 && target.matches('article, li, div[class*="recognitionCtaInner"]') && !target.closest("a[data-service-evidence]");
        const separated = ((pathname === "/" || pathname === "/services" || pathname === "/work") && target.matches("#value article, #services a, #selected_impact [data-scroll-group], #latest_insights a, li[data-scroll-group]")) || timelineEntry || serviceSeparated;
        const animation = target.animate(separated ? [{ borderColor: "transparent" }, { borderColor: "transparent" }] : [{ translate: `0 ${distance}px`, opacity: 0 }, { translate: "0 0", opacity: 1 }], options);
        const companions = separated ? Array.from(target.children).map((child) => child.animate([{ translate: `0 ${distance}px`, opacity: 0 }, { translate: "0 0", opacity: 1 }], options)) : [];
        for (const child of chapterGroups.get(target) ?? []) companions.push(child.animate([{ translate: `0 ${distance}px`, opacity: 0 }, { translate: "0 0", opacity: 1 }], options));
        if (timelineEntry) {
          try { companions.push(target.animate([{ opacity: 0 }, { opacity: 0 }], { ...options, pseudoElement: "::before" })); } catch { /* Keep the marker visible if unsupported. */ }
        }
        if (serviceSeparated) {
          for (const pseudoElement of ["::before", "::after"] as const) {
            const content = getComputedStyle(target, pseudoElement).content;
            if (content && content !== "none" && content !== "normal") {
              try { companions.push(target.animate([{ opacity: 0 }, { opacity: 0 }], { ...options, pseudoElement })); } catch { /* Leave unsupported decorations in place. */ }
            }
          }
        }
        animation.pause();
        animation.currentTime = 0;
        companions.forEach((companion) => { companion.pause(); companion.currentTime = 0; });
        const entry = { animation, companions };
        entries.set(target, entry);
        observer?.observe(target);
        const stepper = pathname === "/" || pathname === "/about" ? target.closest<HTMLElement>("#approach ol, #how-i-work ol") : null;
        if (stepper && !separators.has(stepper)) {
          try {
            const line = stepper.animate([{ opacity: 0 }, { opacity: 0 }], { duration: 1, fill: "both", pseudoElement: "::before" });
            separators.set(stepper, line);
          } catch { /* Keep the line visible if pseudo-element animation is unsupported. */ }
        }
        const supporting = pathname === "/" || pathname === "/services" || pathname === "/work" ? target.closest<HTMLElement>('#latest_insights div[class*="supporting"]') : null;
        if (supporting && !separators.has(supporting)) {
          separators.set(supporting, supporting.animate([{ borderBottomColor: "transparent" }, { borderBottomColor: "transparent" }], { duration: 1, fill: "both" }));
        }
        const timeline = timelineEntry ? target.parentElement : null;
        if (timeline && !separators.has(timeline)) {
          try { separators.set(timeline, timeline.animate([{ opacity: 0 }, { opacity: 0 }], { duration: 1, fill: "both", pseudoElement: "::before" })); } catch { /* Keep the line visible if unsupported. */ }
        }
        const section = pathname === "/about" ? target.closest<HTMLElement>("section") : null;
        if (section && !separators.has(section) && parseFloat(getComputedStyle(section).borderTopWidth) > 0) {
          separators.set(section, section.animate([{ borderTopColor: "transparent" }, { borderTopColor: "transparent" }], { duration: 1, fill: "both" }));
        }
        const serviceList = serviceDetail ? target.closest<HTMLElement>("ol, ul") : null;
        if (serviceList && !separators.has(serviceList)) {
          const content = getComputedStyle(serviceList, "::before").content;
          if (content && content !== "none" && content !== "normal") {
            try { separators.set(serviceList, serviceList.animate([{ opacity: 0 }, { opacity: 0 }], { duration: 1, fill: "both", pseudoElement: "::before" })); } catch { /* Leave unsupported decorations in place. */ }
          }
        }
      });
    };
    const start = () => {
      stop();
      if (motion.matches || !("IntersectionObserver" in window)) return;
      observer = new IntersectionObserver((observed) => {
        observed.forEach((item) => {
          const target = item.target as HTMLElement;
          const entry = entries.get(target);
          if (!entry || (!item.isIntersecting && !(storyDetail && item.boundingClientRect.bottom < 0))) return;
          observer?.unobserve(target);
          entry.animation.onfinish = () => {
            clear(entry);
            entries.delete(target);
            for (const [container, line] of separators) {
              if (container.contains(target) && !Array.from(entries.keys()).some((pending) => container.contains(pending))) { line.cancel(); separators.delete(container); }
            }
          };
          entry.animation.play();
          entry.companions.forEach((animation) => animation.play());
        });
      }, { rootMargin: "0px 0px 160px 0px" });
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
