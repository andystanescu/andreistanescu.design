import { getTestimonials } from "@/lib/testimonials";
import { ReorderableList } from "@/components/admin/ReorderableList/ReorderableList";
import { TestimonialEditor } from "@/components/admin/TestimonialEditor/TestimonialEditor";
import { TestimonialRow } from "@/components/admin/TestimonialEditor/TestimonialRow";
import styles from "../admin.module.css";
import local from "./testimonials.module.css";

export const dynamic = "force-dynamic";

export default async function TestimonialsAdmin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const items = getTestimonials(false);
  return <>
    <header className={`${styles.pageHeader} ${styles.pageHeaderStacked}`}><h1 className="heading-01">Testimonials</h1><p className={`body-small ${styles.helper}`}>Manage the shared strip shown on the pages where it is enabled. Published testimonials appear in the order below.</p></header>
    {error && <p role="alert">{error}</p>}
    <section className={local.addForm}><h2 className="heading-03">Add testimonial</h2><TestimonialEditor /></section>
    {items.length === 0 ? <p className="body-small">No testimonials yet. Add one to get started.</p> :
      <ReorderableList className={`${styles.list} ${styles.serviceCategoryList}`} itemClassName={`${styles.listItem} ${styles.serviceCategoryItem} ${local.listItem}`} handleOnly reorderUrl="/api/admin/testimonials/reorder" items={items.map((item, index) => ({
        id: String(item.id), node: <TestimonialRow item={{ ...item }} index={index} count={items.length} />,
      }))} />}
  </>;
}
