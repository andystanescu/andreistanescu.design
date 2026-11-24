import type { Testimonial } from "@/lib/testimonials";
import type { ReactNode } from "react";
import styles from "./Testimonials.module.css";

export function TestimonialCard({ item, editor }: { item: Testimonial; editor?: { testimonial: ReactNode; name: ReactNode; title_company: ReactNode; source: ReactNode } }) {
  const isUrl = /^https?:\/\//i.test(item.source);
  return <article className={styles.card}>
    <div className={styles.quote}>{editor?.testimonial ?? item.testimonial}</div>
    <div className={styles.attribution}><div className={styles.name}>{editor?.name ?? item.name}</div>{(editor || item.title_company) && <div className={styles.role}>{editor?.title_company ?? item.title_company}</div>}</div>
    {(editor || item.source) && <div className={styles.source}>{editor ? editor.source : isUrl ? <a href={item.source} target="_blank" rel="noopener noreferrer">View original recommendation <span aria-hidden="true">↗</span></a> : item.source}</div>}
  </article>;
}
