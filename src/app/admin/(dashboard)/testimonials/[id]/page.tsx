import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import type { Testimonial } from "@/lib/testimonials";
import styles from "../../admin.module.css";

export const dynamic = "force-dynamic";
export default async function EditTestimonial({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id)) notFound();
  const item = db.prepare("SELECT * FROM testimonials WHERE id = ?").get(Number(id)) as Testimonial | undefined;
  if (!item) notFound();
  return <><header className={`${styles.pageHeader} ${styles.pageHeaderStacked}`}><h1 className="heading-01">Edit testimonial</h1></header>
    <form className={styles.form} action="/api/admin/testimonials" method="post">
      <input type="hidden" name="id" value={item.id} />
      <label className={styles.field}><span>Testimonial</span><textarea className={styles.textarea} name="testimonial" defaultValue={item.testimonial} required /></label>
      <label className={styles.field}><span>Name</span><input className={styles.input} name="name" defaultValue={item.name} required maxLength={200} /></label>
      <label className={styles.field}><span>Title and company</span><input className={styles.input} name="title_company" defaultValue={item.title_company} maxLength={300} /></label>
      <label className={styles.field}><span>Source</span><input className={styles.input} name="source" defaultValue={item.source} maxLength={1000} /><small>For a linked recommendation, enter its full URL.</small></label>
      <label className={styles.checkboxField}><input type="checkbox" name="published" defaultChecked={!!item.published} /><span className={styles.switch} /><span>Published</span></label>
      <div className={styles.formActions}><Link className={styles.tertiaryButton} href="/admin/testimonials">Cancel</Link><button className={styles.submit} type="submit">Save testimonial</button></div>
    </form></>;
}
