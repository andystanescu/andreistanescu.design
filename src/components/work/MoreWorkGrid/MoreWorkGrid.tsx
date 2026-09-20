"use client";

import { useState } from "react";
import { ArrowIcon } from "@/components/Icon/ArrowIcon";
import { ProjectCard } from "@/components/work/ProjectCard/ProjectCard";
import styles from "./MoreWorkGrid.module.css";

type WorkItem = {
  slug: string;
  eyebrow: string;
  category: string;
  year: string;
  title: string;
  description: string;
  thumbnail_image: string;
  in_progress: number;
  password_required: number;
};

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
        {visibleStudies.map((study, index) => (
          <ProjectCard key={study.slug} slug={study.slug} title={study.title} description={study.description} thumbnail={study.thumbnail_image} category={study.category || study.eyebrow} index={index + 2} year={study.year} inProgress={Boolean(study.in_progress)} protectedStudy={Boolean(study.password_required)} />
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
