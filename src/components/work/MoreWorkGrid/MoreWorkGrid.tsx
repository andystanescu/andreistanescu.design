"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowIcon } from "@/components/Icon/ArrowIcon";
import styles from "./MoreWorkGrid.module.css";

type WorkItem = {
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  thumbnail_image: string;
};

function WorkCard({ study }: { study: WorkItem }) {
  return <Link className={styles.card} href={`/work/${encodeURIComponent(study.slug)}`}><div className={styles.thumbnail} style={study.thumbnail_image ? { backgroundImage: `url(${study.thumbnail_image})` } : undefined} aria-hidden="true" /><div className={styles.cardBody}><p className="label-eyebrow" style={{ color: "var(--text-accent)" }}>{study.eyebrow || "CASE STUDY"}</p><h3 className="heading-03">{study.title}</h3><p className="body-small" style={{ color: "var(--text-secondary)" }}>{study.description}</p><span className={styles.cardLink}>View case study <ArrowIcon size={14} /></span></div></Link>;
}

export function MoreWorkGrid({ studies, totalStudies, personal = true }: { studies: WorkItem[]; totalStudies: number; personal?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const visibleStudies = expanded ? studies : studies.slice(0, 6);

  if (!studies.length) return null;

  return (
    <section className={styles.section} aria-labelledby="more-work-title">
      <div className={styles.heading}>
        <p className="label-eyebrow" style={{ color: "var(--text-accent)" }}>
          MORE WORK
        </p>
        <h2 id="more-work-title" className="heading-01">
          A few ways {personal ? "I create" : "we create"} momentum.
        </h2>
      </div>
      <div className={styles.grid}>
        {visibleStudies.map((study) => (
          <WorkCard key={study.slug} study={study} />
        ))}
      </div>
      {!expanded && totalStudies >= 8 && studies.length > 6 && (
        <button type="button" className={styles.moreButton} onClick={() => setExpanded(true)}>
          View more <ArrowIcon size={14} />
        </button>
      )}
    </section>
  );
}
