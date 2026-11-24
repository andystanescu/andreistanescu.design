"use client";
import { useState } from "react";
import type { Testimonial } from "@/lib/testimonials";
import { TestimonialCard } from "@/components/Testimonials/TestimonialCard";
import styles from "@/app/admin/(dashboard)/admin.module.css";
import local from "./TestimonialEditor.module.css";

export function TestimonialEditor({ item, onCancel }: { item?: Testimonial; onCancel?: () => void }) {
  const [values, setValues] = useState({ testimonial: item?.testimonial ?? "", name: item?.name ?? "", title_company: item?.title_company ?? "", source: item?.source ?? "" });
  const entry: Testimonial = { id: item?.id ?? 0, published: item?.published ?? 0, position: item?.position ?? 0, ...values };
  const field = (name: keyof typeof values, label: string, required = false, maxLength?: number) => <textarea className={local.inline} rows={1} name={name} aria-label={label} placeholder={label} value={values[name]} required={required} maxLength={maxLength} onChange={(event) => setValues({ ...values, [name]: event.target.value })} />;
  return <form className={local.form} action="/api/admin/testimonials" method="post">
    {item && <input type="hidden" name="id" value={item.id} />}
    <p className="body-small">Select text in the preview to edit it. Enter a full URL as the source to link to the original.</p>
    <div className={local.preview}><TestimonialCard item={entry} editor={{ testimonial: field("testimonial", "Testimonial", true), name: field("name", "Name", true, 200), title_company: field("title_company", "Title and company", false, 300), source: field("source", "Source", false, 1000) }} /></div>
    <label className={styles.checkboxField}><input type="checkbox" name="published" defaultChecked={!!item?.published} /><span className={styles.switch} aria-hidden="true" /><span>Published</span></label>
    <div className={styles.formActions}>{onCancel && <button type="button" className={styles.tertiaryButton} onClick={onCancel}>Cancel</button>}<button type="submit" className={styles.submit}>{item ? "Save testimonial" : "Add testimonial"}</button></div>
  </form>;
}
