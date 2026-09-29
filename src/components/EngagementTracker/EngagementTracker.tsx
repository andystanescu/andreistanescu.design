"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import type { EngagementContentType, EngagementEventType } from "@/lib/analytics";

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
    return hostname && hostname !== window.location.hostname ? "Other sources" : "Direct";
  } catch { return "Other sources"; }
}

export function EngagementTracker() {
  const pathname = usePathname();
  const sessionId = useRef("");
  const lastPage = useRef("");

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/api")) return;
    if (!sessionId.current) sessionId.current = getSessionId();
    const currentSession = sessionId.current;
    const page = classifyPath(pathname);
    const pageKey = pathname.length > 1 ? decodeURIComponent(pathname).replace(/\/$/, "") : "/";
    const title = document.title.split(/\s+[|—]\s+/)[0].slice(0, 180);
    const queue: QueuedEvent[] = [];
    let lastActivity = 0;
    let lastTick = Date.now();
    let activeRemainder = 0;
    let lastScrollY = window.scrollY;
    let scrollInteractionRecorded = false;
    let lastInteractionRecorded = 0;
    let maxDepth = 0;
    let observer: IntersectionObserver | undefined;
    const chapterTimers = new Map<Element, number>();

    const flush = (beacon = false) => {
      if (!queue.length) return;
      const body = JSON.stringify({ sessionId: currentSession, source: acquisitionSource(), events: queue.splice(0, 25) });
      if (beacon && navigator.sendBeacon) {
        navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
      } else {
        void fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => undefined);
      }
    };
    const emit = (type: EngagementEventType, detail = "", value = 0) => {
      queue.push({ eventId: crypto.randomUUID(), type, pageKey, title, contentType: page.contentType, contentId: page.contentId, detail, value });
      if (queue.length >= 10) flush();
    };
    const markInteraction = (detail: string) => {
      lastActivity = Date.now();
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
      const next = milestones.find((threshold) => progress >= threshold && maxDepth < threshold);
      if (next) { maxDepth = next; emit("depth", "primary_content", next); }
    };
    let scrollFrame = 0;
    const onScroll = () => {
      lastActivity = Date.now();
      if (!scrollInteractionRecorded && Math.abs(window.scrollY - lastScrollY) >= 100) {
        scrollInteractionRecorded = true;
        markInteraction("scroll");
      }
      lastScrollY = window.scrollY;
      if (!scrollFrame) scrollFrame = window.requestAnimationFrame(() => { scrollFrame = 0; reportDepth(); });
    };
    const onKey = (event: KeyboardEvent) => {
      if (["Tab", "ArrowDown", "ArrowUp", "PageDown", "PageUp", " "].includes(event.key)) markInteraction("keyboard");
    };
    const onPointerDown = () => markInteraction("pointer");
    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest("a") : null;
      if (!target) return;
      const href = target.getAttribute("href") || "";
      if (!href) return;
      let detail = "internal_navigation";
      if (/cv-download/i.test(href)) detail = "cv_download";
      else if (href.startsWith("/contact") || target.closest("[data-contact-cta]")) detail = "contact_cta";
      else if (page.contentType === "service" && /^\/(work|insights)\//.test(href)) detail = "evidence_open";
      else if (/^https?:/i.test(href) && !href.startsWith(window.location.origin)) detail = "outbound";
      markInteraction(detail === "internal_navigation" ? "link_navigation" : detail);
      if (detail !== "internal_navigation") emit("action", detail);
    };
    const onVisibility = () => { if (document.visibilityState !== "visible") { tick(); flush(); } };
    const tick = () => {
      const now = Date.now();
      if (document.visibilityState === "visible" && document.hasFocus() && lastActivity > 0) {
        const activeFrom = Math.max(lastTick, lastActivity);
        const activeUntil = Math.min(now, lastActivity + 45_000);
        activeRemainder += Math.max(0, (activeUntil - activeFrom) / 1000);
      }
      lastTick = now;
      const completed = Math.floor(activeRemainder);
      if (completed >= 20) { emit("attention", "active_attention", completed); activeRemainder -= completed; }
    };
    const timer = window.setInterval(() => { tick(); reportDepth(); }, 10_000);
    const onPageHide = () => { tick(); const residual = Math.floor(activeRemainder); if (residual > 0) emit("attention", "active_attention", residual); flush(true); };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onKey, { passive: true });
    document.addEventListener("click", onClick, true);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    reportDepth();

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
      tick();
      const residual = Math.floor(activeRemainder);
      if (residual > 0) emit("attention", "active_attention", residual);
      flush();
      window.clearInterval(timer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointerDown);
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
