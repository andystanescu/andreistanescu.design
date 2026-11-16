"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import type { EngagementContentType, EngagementEventType } from "@/lib/analytics";
import { advanceExposure, MEASUREMENT_VERSION, newExposureState } from "@/lib/engagementMeasurement";
import { collectExposureSections, sectionIsVisible } from "./exposureSections";

type QueuedEvent = { eventId: string; type: EngagementEventType; pageKey: string; title?: string; contentType: EngagementContentType; contentId?: string; detail?: string; value?: number };
const ENDPOINT = "/api/analytics";

function classifyPath(path: string): { contentType: EngagementContentType; contentId: string } {
  if (path === "/") return { contentType: "home", contentId: "" };
  if (path === "/work") return { contentType: "work_index", contentId: "" };
  if (path.startsWith("/work/")) return { contentType: "case_study", contentId: path.slice(6) };
  if (path === "/insights") return { contentType: "articles_index", contentId: "" };
  if (path.startsWith("/insights/")) return { contentType: "article", contentId: path.slice(10) };
  if (path === "/services") return { contentType: "services_index", contentId: "" };
  if (path.startsWith("/services/")) return { contentType: "service", contentId: path.slice(10) };
  if (path === "/about") return { contentType: "about", contentId: "" };
  if (path === "/contact") return { contentType: "contact", contentId: "" };
  return { contentType: "page", contentId: "" };
}

function getSessionId() {
  try {
    const stored = sessionStorage.getItem("conscept_engagement_session");
    if (stored && /^[0-9a-f-]{36}$/i.test(stored)) return stored;
    const created = crypto.randomUUID();
    sessionStorage.setItem("conscept_engagement_session", created);
    return created;
  } catch { return crypto.randomUUID(); }
}

function acquisitionSource() {
  try {
    const hostname = document.referrer ? new URL(document.referrer).hostname.toLowerCase() : "";
    if (hostname.includes("google.")) return "Google";
    if (hostname.includes("linkedin.")) return "LinkedIn";
    return hostname && hostname !== window.location.hostname ? hostname.replace(/^www\./, "") : "Direct";
  } catch { return "Other sources"; }
}

export function EngagementTracker() {
  const pathname = usePathname();
  const sessionId = useRef("");
  const lastPage = useRef("");
  const lastUserInput = useRef(0);

  useEffect(() => {
    if (!pathname || pathname === "/live-component-preview" || pathname.startsWith("/admin") || pathname.startsWith("/api")) return;
    if (!sessionId.current) sessionId.current = getSessionId();
    const currentSession = sessionId.current;
    const page = classifyPath(pathname);
    const pageKey = pathname.length > 1 ? decodeURIComponent(pathname).replace(/\/$/, "") : "/";
    const title = document.title.split(/\s+[|—]\s+/)[0].slice(0, 180);
    const queue: QueuedEvent[] = [];
    let lastActivity = lastUserInput.current;
    let lastTick = Date.now();
    let pageVisible = document.visibilityState === "visible";
    let pageFocused = document.hasFocus();
    let activeRemainder = 0;
    let lastInteractionRecorded = 0;
    let maxDepth = 0;
    let observer: IntersectionObserver | undefined;
    const chapterTimers = new Map<Element, number>();

    const flush = (beacon = false) => {
      while (queue.length) {
        const body = JSON.stringify({ sessionId: currentSession, source: acquisitionSource(), measurementVersion: MEASUREMENT_VERSION, events: queue.splice(0, 25) });
        const sent = beacon && navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
        if (!sent) void fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => undefined);
      }
    };
    const emit = (type: EngagementEventType, detail = "", value = 0) => {
      queue.push({ eventId: crypto.randomUUID(), type, pageKey, title, contentType: page.contentType, contentId: page.contentId, detail, value });
      if (queue.length >= 10) flush();
    };
    const markActivity = () => {
      tick();
      lastActivity = Date.now();
      lastUserInput.current = lastActivity;
    };
    const markInteraction = (detail: string) => {
      markActivity();
      if (lastActivity - lastInteractionRecorded > 2500) {
        emit("interaction", detail);
        lastInteractionRecorded = lastActivity;
      }
    };

    if (lastPage.current !== pathname) {
      emit("page_view");
      lastPage.current = pathname;
    }

    const content = document.querySelector<HTMLElement>('main [class*="RichContent_content"], main [class*="articleBody"], main article, main') || document.querySelector<HTMLElement>("main");
    const reportDepth = () => {
      if (!content) return;
      const rect = content.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      const progress = Math.max(0, Math.min(100, Math.floor(((window.scrollY + window.innerHeight - top) / Math.max(rect.height, 1)) * 100)));
      const milestones = [25, 50, 75, 90, 100];
      const next = milestones.filter((threshold) => progress >= threshold).at(-1);
      if (next && next > maxDepth) { maxDepth = next; emit("depth", "primary_content", next); }
    };
    let scrollFrame = 0;
    const onScroll = () => {
      if (!scrollFrame) scrollFrame = window.requestAnimationFrame(() => { scrollFrame = 0; reportDepth(); });
    };
    const onScrollIntent = () => markInteraction("scroll");
    const onKey = (event: KeyboardEvent) => {
      if (["Tab", "ArrowDown", "ArrowUp", "PageDown", "PageUp", " "].includes(event.key)) markInteraction("keyboard");
    };
    const onPointerDown = () => markInteraction("pointer");
    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest("a") : null;
      if (!target) return;
      const href = target.getAttribute("href") || "";
      if (!href) return;
      let destination: URL;
      try { destination = new URL(href, window.location.href); } catch { return; }
      let detail = "internal_navigation";
      if (/cv-download/i.test(href)) detail = "cv_download";
      else if ((destination.origin === window.location.origin && destination.pathname === "/contact") || target.closest("[data-contact-cta]")) detail = "contact_cta";
      else if (page.contentType === "service" && target.closest("[data-service-evidence]")) detail = "evidence_open";
      else if (target.closest("[data-related-reading]")) detail = "related_open";
      else if (destination.origin !== window.location.origin && /^https?:$/.test(destination.protocol)) detail = "outbound";
      else if (destination.origin === window.location.origin && destination.pathname === window.location.pathname && destination.hash) detail = "chapter_navigation";
      if (detail === "internal_navigation") markInteraction("link_navigation");
      else { markActivity(); emit("action", detail); }
      if (destination.origin === window.location.origin && /^\/(work|insights|services|about|contact)(\/|$)/.test(destination.pathname) && destination.pathname !== window.location.pathname) {
        const path = destination.pathname.replace(/\/$/, "") || "/";
        if (/^\/[\w\-/]+$/.test(path)) emit("navigation", path);
      }
    };
    const onCategoryFilter = () => { markActivity(); emit("action", "category_filter"); };
    const tick = () => {
      const now = Date.now();
      if (pageVisible && pageFocused && lastActivity > 0) {
        const activeFrom = Math.max(lastTick, lastActivity);
        const activeUntil = Math.min(now, lastActivity + 45_000);
        activeRemainder += Math.max(0, (activeUntil - activeFrom) / 1000);
      }
      lastTick = now;
      const completed = Math.floor(activeRemainder);
      if (completed >= 20) { emit("attention", "active_attention", completed); activeRemainder -= completed; }
    };
    const main = document.querySelector<HTMLElement>("main");
    const exposureSections = main ? collectExposureSections(main, page.contentType) : [];
    const exposureStates = exposureSections.map(() => newExposureState());
    let lastExposureSample = Date.now();
    if (exposureSections.length) emit("exposure_ready", exposureSections.some((section) => section.detail === "outcomes") ? "v2_outcomes" : "v2", exposureSections.length);
    const sampleExposure = () => {
      const now = Date.now();
      if (!pageVisible) {
        exposureStates.forEach((state) => { state.active = false; });
        lastExposureSample = now;
        return;
      }
      const active = pageVisible && pageFocused && lastActivity > 0 && now - lastActivity <= 45_000;
      exposureSections.forEach((section, index) => {
        const visible = pageVisible && sectionIsVisible(section, window.innerHeight, window.innerWidth);
        const result = advanceExposure(exposureStates[index], visible, active, now - lastExposureSample);
        exposureStates[index] = result.state;
        result.signals.forEach((signal) => emit(signal, section.detail));
      });
      lastExposureSample = now;
    };
    const flushAttention = (beacon: boolean) => { tick(); sampleExposure(); const residual = Math.floor(activeRemainder); if (residual > 0) { emit("attention", "active_attention", residual); activeRemainder -= residual; } flush(beacon); };
    const onVisibility = () => { flushAttention(document.visibilityState !== "visible"); pageVisible = document.visibilityState === "visible"; sampleExposure(); };
    const onFocus = () => { tick(); pageFocused = true; sampleExposure(); };
    const onBlur = () => { flushAttention(true); pageFocused = false; sampleExposure(); };
    const timer = window.setInterval(() => { tick(); reportDepth(); }, 10_000);
    const exposureTimer = window.setInterval(sampleExposure, 1_000);
    const onPageHide = () => flushAttention(true);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", onScrollIntent, { passive: true });
    window.addEventListener("touchmove", onScrollIntent, { passive: true });
    window.addEventListener("keydown", onKey, { passive: true });
    document.addEventListener("click", onClick, true);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);
    window.addEventListener("conscept:category-filter", onCategoryFilter);
    reportDepth();
    sampleExposure();

    if (page.contentType === "case_study" && content && "IntersectionObserver" in window) {
      observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          const prior = chapterTimers.get(entry.target);
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5 && prior === undefined) {
            const timerId = window.setTimeout(() => {
              const heading = entry.target as HTMLElement;
              if (heading.id) emit("chapter_view", heading.innerText.trim().slice(0, 120));
              chapterTimers.delete(entry.target);
            }, 1200);
            chapterTimers.set(entry.target, timerId);
          } else if ((!entry.isIntersecting || entry.intersectionRatio < 0.5) && prior !== undefined) {
            window.clearTimeout(prior);
            chapterTimers.delete(entry.target);
          }
        }
      }, { threshold: [0, 0.5] });
      content.querySelectorAll<HTMLElement>("h2[id], h3[id]").forEach((heading) => { if (!heading.closest("#engagement-assessment")) observer?.observe(heading); });
    }

    return () => {
      flushAttention(true);
      window.clearInterval(timer);
      window.clearInterval(exposureTimer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", onScrollIntent);
      window.removeEventListener("touchmove", onScrollIntent);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("conscept:category-filter", onCategoryFilter);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      observer?.disconnect();
      for (const timerId of chapterTimers.values()) window.clearTimeout(timerId);
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
    };
  }, [pathname]);

  return null;
}
