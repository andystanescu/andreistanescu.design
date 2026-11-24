"use client";
import { useState } from "react";
import type { Testimonial } from "@/lib/testimonials";
import { AdminIcon } from "@/components/admin/AdminIcon/AdminIcon";
import { TestimonialActions } from "@/components/admin/TestimonialActions/TestimonialActions";
import { TestimonialEditor } from "./TestimonialEditor";
import styles from "@/app/admin/(dashboard)/admin.module.css";
import local from "@/app/admin/(dashboard)/testimonials/testimonials.module.css";

export function TestimonialRow({ item, index, count }: { item: Testimonial; index: number; count: number }) {
  const [open, setOpen] = useState(false);
  return <div className={local.row}>
    <div className={local.rowHeader}>
      <button className={local.expand} type="button" aria-expanded={open} onClick={() => setOpen(!open)}><span className={styles.listItemMeta}><span className="body-default">{item.name}</span><span className={`body-small ${local.excerpt}`}>{item.testimonial}</span></span></button>
      <div className={`${styles.listItemActions} ${styles.serviceCategoryActions}`}>
        <TestimonialActions id={item.id} name={item.name} published={!!item.published} />
        <form action="/api/admin/testimonials" method="post"><input type="hidden" name="id" value={item.id} /><button name="action" value="up" disabled={index === 0} aria-label={`Move ${item.name} up`}><AdminIcon name="direction-arrow-up" /></button><button name="action" value="down" disabled={index === count - 1} aria-label={`Move ${item.name} down`}><AdminIcon name="direction-arrow-down" /></button></form>
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={`${open ? "Collapse" : "Edit"} testimonial from ${item.name}`}><AdminIcon name={open ? "action-minus" : "action-plus"} /></button>
      </div>
    </div>
    {open && <div className={local.edit}><TestimonialEditor item={item} onCancel={() => setOpen(false)} /></div>}
  </div>;
}
