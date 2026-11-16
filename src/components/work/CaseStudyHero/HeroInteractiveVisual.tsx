"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { LiveComponentBlock } from "@/components/LiveComponentBlock/LiveComponentBlock";
import styles from "./CaseStudyHero.module.css";

function subscribe(update: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", update);
  return () => media.removeEventListener("change", update);
}

export function HeroInteractiveVisual({ code }: { code: string }) {
  const reducedMotion = useSyncExternalStore(subscribe, () => window.matchMedia("(prefers-reduced-motion: reduce)").matches, () => true);
  if (!code.trim() || reducedMotion) return null;
  return <RunningHeroVisual code={code} />;
}

function RunningHeroVisual({ code }: { code: string }) {
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  const onFailure = useCallback(() => setReady(false), []);
  return <div className={styles.interactiveVisual} style={{ visibility: ready ? "visible" : "hidden" }}><LiveComponentBlock code={code} runtime="react" chrome="minimal" fill onReady={onReady} onFailure={onFailure} /></div>;
}
