import Link from "next/link";
import { getGenericPages, getMainNavPages, RELOCATED_PAGE_SLUGS } from "@/lib/pages";
import { ReorderableList } from "@/components/admin/ReorderableList/ReorderableList";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

export default function AdminPagesPage() {
  const pages = getGenericPages();
  const navPages = getMainNavPages();

  function editHref(slug: string) {
    return RELOCATED_PAGE_SLUGS.has(slug)
      ? `/admin/${slug}/settings`
      : `/admin/pages/${slug}`;
  }

  return (
    <>
      <div className={`${styles.pageHeader} ${styles.pageHeaderStacked}`}>
        <h1 className="heading-01">Main navigation</h1>
        <p className={`body-small ${styles.helper}`}>
          Drag the items below to set the order of the public header. The list
          includes pages managed in their own admin sections, such as Work,
          Services, Approach, Insights, and About. Use each page&apos;s settings to
          change its label or whether it appears in the navigation.
        </p>
      </div>
      <div className={styles.pageColumns}>
        <section className={styles.pageColumn}>
          <h2 className="heading-02">Main navigation</h2>
          <p className={`body-small ${styles.helper}`}>
            Drag the items below to set the order of the public header.
          </p>
          <ReorderableList
            className={styles.list}
            itemClassName={styles.listItem}
            reorderUrl="/api/admin/pages/reorder"
            items={navPages.map((page) => ({
              id: page.slug,
              node: <div className={styles.listItemMeta}>
                <p className="body-default">{page.nav_label || page.title}</p>
                <p className="body-small" style={{ color: "var(--text-tertiary)" }}>/{page.slug}</p>
              </div>,
            }))}
          />
        </section>

        <section className={styles.pageColumn}>
          <h2 className="heading-02">Other pages</h2>
          <p className={`body-small ${styles.helper}`}>
            Pages that are not currently part of the public main navigation.
          </p>
          <ul className={styles.list}>
            {pages.filter((page) => !page.show_in_nav).map((page) => (
              <li key={page.slug} className={styles.listItem}>
                <div className={styles.listItemMeta}>
                  <p className="body-default">{page.title}</p>
                  <p className="body-small" style={{ color: "var(--text-tertiary)" }}>/{page.slug}</p>
                </div>
                <div className={styles.listItemActions}>
                  <Link href={editHref(page.slug)} className={styles.editLink}>
                    <span aria-hidden="true">✎</span><span className={styles.srOnly}>Edit page</span>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
