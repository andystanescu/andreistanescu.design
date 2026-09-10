"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import styles from "./CaseStudyPasswordGate.module.css";

export function CaseStudyPasswordGate({ slug, error, onUnlocked }: { slug: string; error?: string; onUnlocked: () => void }) {
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
      onUnlocked();
    } catch {
      setMessage("The password could not be checked. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }
  return <div className={styles.overlay}><section className={styles.card} aria-label="Password protected case study"><p className="label-eyebrow">Password protected case study</p><h1 className="heading-01">Enter password to continue</h1><p className="body-default">This case study is protected. Enter the password I provided to remove the blur and continue reading.</p>{message && <p className={styles.error} role="alert">{message}</p>}<form onSubmit={handleSubmit}><label className={styles.field}><span className="label-small">Password</span><input name="password" type="password" required autoComplete="off" autoFocus /></label><button type="submit" disabled={submitting}>{submitting ? "Checking…" : "Continue"}</button></form><p className={styles.contactMessage}>If you don&apos;t have a password, please <Link href="/contact">contact me</Link> and I will provide one.</p><Link className={styles.secondaryAction} href="/work">View other case studies</Link></section></div>;
}
