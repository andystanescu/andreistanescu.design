"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./CaseStudyPasswordGate.module.css";

export function CaseStudyPasswordGate({ slug, error, onUnlocked }: { slug: string; error?: string; onUnlocked?: () => void }) {
  const router = useRouter();
  const [message, setMessage] = useState(error ? "That password was not recognised." : "");
  const [submitting, setSubmitting] = useState(false);
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch(`/api/case-studies/${encodeURIComponent(slug)}/unlock`, { method: "POST", body: new FormData(event.currentTarget), headers: { "x-card-unlock": "1" } });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.unlocked) {
        setMessage(result.error || "That password was not recognised.");
        return;
      }
      if (onUnlocked) onUnlocked(); else router.refresh();
    } catch {
      setMessage("The password could not be checked. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }
  return <section className={`container ${styles.gate}`} aria-labelledby="protected-story-title"><div className={styles.card}><p className="label-eyebrow">Password protected case study</p><h2 id="protected-story-title" className="heading-02">Enter password to read the full case study.</h2><p className="body-default">Enter the password I provided to continue reading.</p>{message && <p className={styles.error} role="alert">{message}</p>}<form action={`/api/case-studies/${encodeURIComponent(slug)}/unlock`} method="POST" autoComplete="off" onSubmit={handleSubmit}><label className={styles.field}><span className="label-small">Password</span><input name="password" type="password" required autoComplete="off" /></label><button type="submit" disabled={submitting}>{submitting ? "Checking…" : "Unlock"}</button></form><p className={styles.contactMessage}>If you don&apos;t have a password, please <Link href="/contact">contact me</Link> and I will provide one.</p><Link className={styles.secondaryAction} href="/work">View other case studies</Link></div></section>;
}
