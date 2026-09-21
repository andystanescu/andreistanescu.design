"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RelatedReadingList } from "@/components/RelatedReadingList/RelatedReadingList";
import type { ResolvedRelatedReading } from "@/lib/relatedReadings";
import styles from "./TableOfContents.module.css";

type TocItem = { id: string; text: string };

export function TableOfContents({ items, relatedReadings = [] }: { items: TocItem[]; relatedReadings?: ResolvedRelatedReading[] }) {
  const router = useRouter();
  const responsiveRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const historyEntryRef = useRef(false);
  const pendingNavigationRef = useRef<string | null>(null);
  const restoreFocusRef = useRef(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [mobileDialog, setMobileDialog] = useState(false);

  useEffect(() => {
    if (items.length === 0) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const activationLine = 112;
      let nextIndex = 0;
      items.forEach((item, index) => {
        const heading = document.getElementById(item.id);
        if (heading && heading.getBoundingClientRect().top <= activationLine) nextIndex = index;
      });
      setActiveIndex(nextIndex);
    };
    const scheduleUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [items]);

  useEffect(() => {
    if (!open) return;
    const isMobile = window.matchMedia("(max-width: 640px)").matches;
    const previousOverflow = document.body.style.overflow;
    if (isMobile) {
      document.body.style.overflow = "hidden";
      document.body.classList.add("chapter-navigator-open");
    }
    window.requestAnimationFrame(() => closeRef.current?.focus());
    const onPointerDown = (event: PointerEvent) => {
      if (!isMobile && responsiveRef.current && !responsiveRef.current.contains(event.target as Node)) {
        event.preventDefault();
        closeNavigator();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeNavigator();
      if (event.key === "Tab" && isMobile && panelRef.current) {
        const controls = Array.from(panelRef.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled])'));
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    const onPopState = () => {
      historyEntryRef.current = false;
      setOpen(false);
      const destination = pendingNavigationRef.current;
      pendingNavigationRef.current = null;
      if (destination) router.push(destination, { scroll: true });
      else if (restoreFocusRef.current) toggleRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("popstate", onPopState);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.classList.remove("chapter-navigator-open");
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("popstate", onPopState);
    };
  }, [open, router]);

  function openNavigator() {
    setMobileDialog(window.matchMedia("(max-width: 640px)").matches);
    window.history.pushState({ ...(window.history.state || {}), chapterNavigatorOpen: true }, "");
    historyEntryRef.current = true;
    setOpen(true);
  }

  function closeNavigator({ restoreFocus = true, navigateTo }: { restoreFocus?: boolean; navigateTo?: string } = {}) {
    if (historyEntryRef.current) {
      pendingNavigationRef.current = navigateTo || null;
      restoreFocusRef.current = restoreFocus;
      window.history.back();
      return;
    }
    setOpen(false);
    if (navigateTo) router.push(navigateTo, { scroll: true });
    else if (restoreFocus) window.requestAnimationFrame(() => toggleRef.current?.focus());
  }

  const activeItem = items[activeIndex];
  const digits = Math.max(2, String(items.length).length);
  const progress = items.length > 0 ? ((activeIndex + 1) / items.length) * 100 : 0;

  return (
    <>
      {items.length > 0 && (
        <nav className={styles.desktopNavigator} aria-label="On this page">
          <div className={styles.desktopHeader}>
            <span>ON THIS PAGE</span>
            <span>{String(activeIndex + 1).padStart(digits, "0")} / {String(items.length).padStart(digits, "0")}</span>
          </div>
          <div className={styles.progressTrack} role="progressbar" aria-label="Reading progress by section" aria-valuemin={1} aria-valuemax={items.length} aria-valuenow={activeIndex + 1}>
            <i style={{ width: `${progress}%` }} />
          </div>
          <ol className={styles.desktopList}>
            {items.map((item, index) => (
              <li key={item.id}>
                <a href={`#${item.id}`} aria-current={index === activeIndex ? "location" : undefined}>
                  <span>{String(index + 1).padStart(digits, "0")}</span>
                  <strong>{item.text}</strong>
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div ref={responsiveRef} className={`${styles.navigator} ${open ? styles.navigatorOpen : ""}`}>
        <button ref={toggleRef} type="button" className={styles.navigatorToggle} aria-expanded={open} aria-controls="chapter-navigator-panel" onClick={() => open ? closeNavigator() : openNavigator()}>
          <span className={styles.position}>{items.length > 0 ? `${String(activeIndex + 1).padStart(digits, "0")} / ${String(items.length).padStart(digits, "0")}` : "Related"}</span>
          <span className={styles.current}>{activeItem?.text || "Reading"}</span>
          <span className={styles.arrow} aria-hidden="true">↓</span>
        </button>
        {open && <div ref={panelRef} id="chapter-navigator-panel" className={styles.navigatorPanel} role="dialog" aria-modal={mobileDialog || undefined} aria-label="Chapter navigation">
          <header className={styles.panelHeader}><span>ON THIS PAGE</span><button ref={closeRef} type="button" onClick={() => closeNavigator()} aria-label="Close chapter navigation">×</button></header>
          <div className={styles.panelScroll}>
            {items.length > 0 && <nav aria-label="On this page"><ol>{items.map((item, index) => { const href = `#${item.id}`; return <li key={item.id}><a href={href} aria-current={index === activeIndex ? "location" : undefined} onClick={(event) => { event.preventDefault(); closeNavigator({ restoreFocus: false, navigateTo: href }); }}><span>{String(index + 1).padStart(digits, "0")}</span><strong>{item.text}</strong></a></li>; })}</ol></nav>}
            <RelatedReadingList items={relatedReadings} onNavigate={(href) => closeNavigator({ restoreFocus: false, navigateTo: href })} />
          </div>
        </div>}
      </div>
    </>
  );
}
