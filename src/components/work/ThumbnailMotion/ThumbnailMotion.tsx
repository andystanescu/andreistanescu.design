"use client";

import { useEffect, useRef, useState } from "react";
import { HeroInteractiveVisual } from "@/components/work/CaseStudyHero/HeroInteractiveVisual";
import styles from "./ThumbnailMotion.module.css";

/** Treat the hero as a decorative 16:10 canvas and crop it like an image. */
export function ThumbnailMotion({ code }: { code?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [scale, setScale] = useState(0);
  useEffect(() => {
    const element = host.current;
    if (!element || !code?.trim()) return;
    const resize = new ResizeObserver(([entry]) => {
      if (entry) setScale(Math.max(entry.contentRect.width / 960, entry.contentRect.height / 600));
    });
    const intersection = new IntersectionObserver(([entry]) => setActive(Boolean(entry?.isIntersecting)), { rootMargin: "200px" });
    resize.observe(element);
    intersection.observe(element);
    return () => { resize.disconnect(); intersection.disconnect(); };
  }, [code]);
  if (!code?.trim()) return null;
  return <div ref={host} className={styles.host} aria-hidden="true" inert>
    {active && scale > 0 && <div className={styles.canvas} style={{ transform: `translate(-50%, -50%) scale(${scale})` }}><HeroInteractiveVisual code={code} /></div>}
  </div>;
}
