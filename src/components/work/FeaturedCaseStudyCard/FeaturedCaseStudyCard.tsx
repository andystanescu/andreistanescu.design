"use client";

import { useState } from "react";
import { ArrowIcon } from "@/components/Icon/ArrowIcon";
import styles from "@/app/work/work.module.css";

export function FeaturedCaseStudyCard({ slug, title, description, thumbnail, passwordRequired, category = "CASE STUDY", year = "" }: { slug: string; title: string; description: string; thumbnail: string; passwordRequired: boolean; category?: string; year?: string }) {
  const [unlocking, setUnlocking] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const response = await fetch(`/api/case-studies/${encodeURIComponent(slug)}/unlock`, { method: "POST", headers: { "x-card-unlock": "1" }, body: new FormData(event.currentTarget) });
    if (!response.ok) { setError("This is not the correct password. If I gave you the password, you can check our conversation, or you can always reach out to me again."); return; }
    const result = await response.json();
    window.location.href = result.redirect;
  };
  if (unlocking) return <div className={`${styles.featured} ${styles.featuredUnlock}`} tabIndex={-1} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) { setUnlocking(false); setPassword(""); setError(""); } }}><div className={styles.featuredUnlockContent}><p className="label-eyebrow">PASSWORD PROTECTED CASE STUDY</p><h2 className="heading-01">Password protected case study</h2><p>This case study contains information that is sensitive or needs special permissions to display. Please enter the password I provided to unlock it.</p><form onSubmit={submit}><input name="password" type="text" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" autoFocus required autoComplete="off" /><button type="submit">Unlock</button></form>{error && <small>{error}</small>}</div></div>;
  return <button type="button" className={styles.featured} onClick={() => passwordRequired ? setUnlocking(true) : window.location.href = `/work/${slug}`}><div className={styles.featuredVisual} style={thumbnail ? { backgroundImage: `url(${thumbnail})` } : undefined} aria-hidden="true"><span className={styles.featuredMeta}><i aria-hidden="true" />{category}{year ? ` · ${year}` : ""}</span></div><div className={styles.featuredCopy}><p className="label-eyebrow" style={{ color: "#ff8a66" }}>FEATURED CASE STUDY</p><h2 className="heading-01">{title}</h2><p className="body-default" style={{ color: "#c8ccd0" }}>{description}</p><span className={styles.featuredLink}>Read case study <ArrowIcon size={16} /></span></div></button>;
}
