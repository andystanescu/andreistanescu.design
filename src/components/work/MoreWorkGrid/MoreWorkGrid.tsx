"use client";

import { useState } from "react";
import { ArrowIcon } from "@/components/Icon/ArrowIcon";
import styles from "./MoreWorkGrid.module.css";

type WorkItem = {
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  thumbnail_image: string;
  password_required: boolean;
};

function ProtectedCard({ study }: { study: WorkItem }) {
  const [unlocking, setUnlocking] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const response = await fetch(`/api/case-studies/${encodeURIComponent(study.slug)}/unlock`, { method: "POST", headers: { "x-card-unlock": "1" }, body: new FormData(event.currentTarget) });
    if (!response.ok) { setError("This is not the correct password. If I gave you the password, you can check our conversation, or you can always reach out to me again."); return; }
    const result = await response.json();
    window.location.href = result.redirect;
  };
  if (unlocking) return <div className={styles.card} tabIndex={-1} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) { setUnlocking(false); setPassword(""); setError(""); } }}><div className={styles.unlockThumbnail}><p className="label-eyebrow">PASSWORD PROTECTED CASE STUDY</p><h3>Password protected case study</h3><p>This case study contains information that is sensitive or needs special permissions to display. Please enter the password I provided to unlock it.</p><form onSubmit={submit}><input name="password" type="text" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" autoFocus required autoComplete="off" /><button type="submit">Unlock</button></form>{error && <small className={styles.unlockError}>{error}</small>}</div></div>;
  return <button type="button" className={styles.card} onClick={() => study.password_required ? setUnlocking(true) : window.location.href = `/work/${study.slug}`}><div className={styles.thumbnail} style={study.thumbnail_image ? { backgroundImage: `url(${study.thumbnail_image})` } : undefined} aria-hidden="true" /><div className={styles.cardBody}><p className="label-eyebrow" style={{ color: "var(--text-accent)" }}>{study.eyebrow || "CASE STUDY"}</p><h3 className="heading-03">{study.title}</h3><p className="body-small" style={{ color: "var(--text-secondary)" }}>{study.description}</p><span className={styles.cardLink}>View case study <ArrowIcon size={14} /></span></div></button>;
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
          <ProtectedCard key={study.slug} study={study} />
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
