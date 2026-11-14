"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./CaseStudyPasswordGate.module.css";

const incorrectPassword = "That password didn’t work. Check it and try again, or ask me for a new one.";

export function CaseStudyPasswordGate({ slug, error, onUnlocked }: { slug: string; error?: string; onUnlocked?: () => void }) {
  const router = useRouter();
  const [message, setMessage] = useState(error ? incorrectPassword : "");
  const [submitting, setSubmitting] = useState(false);
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch(`/api/case-studies/${encodeURIComponent(slug)}/unlock`, { method: "POST", body: new FormData(event.currentTarget), headers: { "x-card-unlock": "1" } });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.unlocked) {
        setMessage(response.status === 401 ? incorrectPassword : result.error || "The password could not be checked. Please try again.");
        return;
      }
      if (onUnlocked) onUnlocked(); else router.refresh();
    } catch {
      setMessage("The password could not be checked. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }
  return <section className={`container ${styles.gate}`} aria-labelledby="protected-story-title"><div className={styles.card}><h2 id="protected-story-title" className="heading-02">This case study is private</h2><p className="body-default">It includes work I can’t share publicly. Enter the password I sent you to read it in full.</p>{message && <p className={styles.error} role="alert">{message}</p>}<form action={`/api/case-studies/${encodeURIComponent(slug)}/unlock`} method="POST" autoComplete="off" onSubmit={handleSubmit}><label className={styles.field}><span className="label-small">Password</span><input name="password" type="password" required autoComplete="off" /></label><button type="submit" disabled={submitting}>{submitting ? "Checking…" : "View case study"}</button></form><p className={styles.contactMessage}>Don’t have a password? <Link href="/contact">Get in touch</Link> and I’ll send you one.</p></div></section>;
}
