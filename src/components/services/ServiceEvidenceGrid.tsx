"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { selectEvidence, type EvidenceCandidate } from "@/lib/evidenceSelection";
import styles from "@/app/services/[slug]/service-detail.module.css";

export type EvidenceItem = EvidenceCandidate & { title: string; description: string; metadata: string };

export function ServiceEvidenceGrid({ category, items }: { category: string; items: EvidenceItem[] }) {
  const [selected, setSelected] = useState<EvidenceItem[]>([]);
  useEffect(() => {
    const key = `service-evidence:${category}`;
    const signature = JSON.stringify(items.map((item) => `${item.type}:${item.href}`).sort());
    let selection: EvidenceItem[] | undefined;
    try {
      const saved = JSON.parse(sessionStorage.getItem(key) || "null") as { signature: string; keys: string[] } | null;
      if (saved?.signature === signature && Array.isArray(saved.keys)) {
        const byKey = new Map(items.map((item) => [`${item.type}:${item.href}`, item]));
        const restored = saved.keys.map((itemKey) => byKey.get(itemKey));
        if (restored.every((item): item is EvidenceItem => !!item)) selection = restored;
      }
      if (!selection) {
        selection = selectEvidence(items);
        sessionStorage.setItem(key, JSON.stringify({ signature, keys: selection.map((item) => `${item.type}:${item.href}`) }));
      }
    } catch {
      selection = selectEvidence(items);
    }
    // Session storage is available only after hydration; the server cannot choose this session's sample.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelected(selection);
  }, [category, items]);
  const gridCountClass = selected.length === 1 ? styles.evidenceGridSingle : selected.length === 2 ? styles.evidenceGridTwo : styles.evidenceGridThree;
  return <div className={`${styles.evidenceGrid} ${gridCountClass}`}>
    {selected.map((item) => <Link className={`${styles.evidenceItem} ${item.type === "article" ? styles.evidenceArticle : styles.evidenceCaseStudy}`} href={item.href} aria-label={`${item.type === "article" ? "Read article" : "View case study"}: ${item.title}`} key={`${item.type}-${item.href}`}>
      <article className={styles.evidenceContent}>
        <p className={`label-eyebrow ${styles.evidenceType}`}>{item.type === "case-study" ? "CASE STUDY" : "ARTICLE"}</p>
        <h3 className={styles.evidenceTitle}>{item.title}</h3>
        <p className={styles.evidenceDescription}>{item.description}</p>
        <div className={styles.evidenceFooter}><p className={styles.evidenceMetadata}>{item.metadata}</p><span className={styles.evidenceAction}>{item.type === "case-study" ? "View case study" : "Read article"}<span aria-hidden="true">→</span></span></div>
      </article>
    </Link>)}
  </div>;
}
