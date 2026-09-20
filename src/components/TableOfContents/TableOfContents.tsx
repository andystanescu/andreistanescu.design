"use client";

import { useEffect, useRef, useState } from "react";
import { RelatedReadingList } from "@/components/RelatedReadingList/RelatedReadingList";
import type { ResolvedRelatedReading } from "@/lib/relatedReadings";
import styles from "./TableOfContents.module.css";

type TocItem = { id: string; text: string };

export function TableOfContents({ items, relatedReadings = [] }: { items: TocItem[]; relatedReadings?: ResolvedRelatedReading[] }) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

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
      <details ref={detailsRef} className={`mobileToc ${styles.navigator}`}>
        <summary>
          <span className={styles.position}>{items.length > 0 ? `${String(activeIndex + 1).padStart(digits, "0")} / ${String(items.length).padStart(digits, "0")}` : "Related"}</span>
          <span className={styles.current}>{activeItem?.text || "Reading"}</span>
          <span className={styles.arrow} aria-hidden="true">↓</span>
        </summary>
        {items.length > 0 && <nav aria-label="On this page"><ol>{items.map((item, index) => <li key={item.id}><a href={`#${item.id}`} aria-current={index === activeIndex ? "location" : undefined} onClick={() => detailsRef.current?.removeAttribute("open")}><span>{String(index + 1).padStart(digits, "0")}</span><strong>{item.text}</strong></a></li>)}</ol></nav>}
        <RelatedReadingList items={relatedReadings} />
      </details>
    </>
  );
}
