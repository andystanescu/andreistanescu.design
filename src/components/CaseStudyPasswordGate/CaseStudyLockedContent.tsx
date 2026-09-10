"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ContentViewTracker } from "@/components/ContentViewTracker/ContentViewTracker";
import { CaseStudyPasswordGate } from "./CaseStudyPasswordGate";
import styles from "./CaseStudyPasswordGate.module.css";

export function CaseStudyLockedContent({ slug, locked, error, children }: { slug: string; locked: boolean; error?: string; children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(!locked);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const isLocked = locked && !unlocked;

  useEffect(() => {
    const frame = requestAnimationFrame(() => setPortalTarget(document.body));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!isLocked) return;
    const previousBodyOverflow = document.body.style.overflow;
    const previousDocumentOverflow = document.documentElement.style.overflow;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousDocumentOverflow;
    };
  }, [isLocked]);

  const gate = isLocked ? <CaseStudyPasswordGate slug={slug} error={error} onUnlocked={() => setUnlocked(true)} /> : null;
  return <div className={isLocked ? styles.lockedContent : undefined}>{!isLocked && <ContentViewTracker contentType="case_study" contentId={slug} />}<div className={isLocked ? styles.blurredContent : undefined}>{children}</div>{portalTarget && gate ? createPortal(gate, portalTarget) : null}</div>;
}
