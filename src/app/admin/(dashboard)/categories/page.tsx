import Link from "next/link";
import { db } from "@/lib/db";
import { AdminIcon } from "@/components/admin/AdminIcon/AdminIcon";
import { AdminTabs } from "@/components/admin/AdminTabs/AdminTabs";
import { ReorderableList } from "@/components/admin/ReorderableList/ReorderableList";
import { ServiceToggle } from "@/components/admin/ServiceToggle/ServiceToggle";
import { CategoryDeleteActions } from "@/components/admin/CategoryDeleteActions/CategoryDeleteActions";
import { SERVICES_TABS } from "../adminTabs";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const categories = db.prepare(`SELECT c.id, c.name, s.id AS service_id, s.slug, s.service_enabled, s.published, s.show_on_homepage
    FROM categories c LEFT JOIN service_items s ON s.category_id = c.id ORDER BY c.position, c.id`).all() as Array<{ id: number; name: string; service_id: number | null; slug: string | null; service_enabled: number | null; published: number | null; show_on_homepage: number | null }>;
  return <>
    <div className={styles.pageHeaderGroup}><div className={styles.pageHeader}><h1 className="heading-01">Categories &amp; services</h1></div><AdminTabs embedded tabs={SERVICES_TABS} active="/admin/categories" /></div>
    <p className={`body-small ${styles.helper}`}>Every entry is available to case studies and articles. Turn on a dedicated service to show it on the Services page; switching it off keeps its page content and category assignments.</p>
    {error && <p role="alert" style={{ color: "var(--border-error)" }}>{error}</p>}
    <form className={styles.form} action="/api/admin/categories" method="POST">
      <label className={styles.field}><span className="label-small">New category</span><input className={styles.input} name="name" required maxLength={120} /></label>
      <div className={styles.formActions}><button className={styles.submit} type="submit">Add category</button></div>
    </form>
    <ReorderableList className={`${styles.list} ${styles.serviceCategoryList}`} itemClassName={`${styles.listItem} ${styles.serviceCategoryItem}`} reorderUrl="/api/admin/categories/reorder" items={categories.map((category, index) => ({
      id: String(category.id),
      node: <>
        <div className={styles.listItemMeta}><p className="body-default">{category.name}{Boolean(category.service_enabled && category.published && category.show_on_homepage) && <span className="body-small" style={{ color: "var(--text-accent)", marginLeft: "var(--space-150)" }}>on homepage</span>}</p><p className="body-small" style={{ color: "var(--text-tertiary)" }}>{category.slug ? `/services/${category.slug}` : "Category only"}</p></div>
        <div className={`${styles.listItemActions} ${styles.serviceCategoryActions}`}>
          <ServiceToggle categoryId={category.id} enabled={Boolean(category.service_enabled && category.published)} name={category.name} />
          <form action={`/api/admin/categories/${category.id}/move`} method="POST"><input type="hidden" name="direction" value="up" /><button type="submit" disabled={index === 0} aria-label={`Move ${category.name} up`}><AdminIcon name="direction-arrow-up" /></button></form>
          <form action={`/api/admin/categories/${category.id}/move`} method="POST"><input type="hidden" name="direction" value="down" /><button type="submit" disabled={index === categories.length - 1} aria-label={`Move ${category.name} down`}><AdminIcon name="direction-arrow-down" /></button></form>
          <Link href={`/admin/categories/${category.id}`} className={styles.editLink} aria-label={`Edit ${category.name}`} title="Edit category and service"><AdminIcon name="action-edit" /></Link>
          <CategoryDeleteActions id={category.id} name={category.name} hasService={Boolean(category.service_id)} />
        </div>
      </>,
    }))} />
  </>;
}
