import Link from "next/link";
import { getAllHighlightItemsAdmin } from "@/lib/about";
import { ReorderableList } from "@/components/admin/ReorderableList/ReorderableList";
import { AboutAdminHeader } from "@/components/admin/AboutAdminHeader/AboutAdminHeader";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

export default function AdminAboutHighlightsPage() {
  const items = getAllHighlightItemsAdmin();

  return (
    <>
      <AboutAdminHeader active="/admin/about-highlights" />
      <div className={styles.contentTitleRow}>
        <p className="heading-02">Highlights</p>
        <Link href="/admin/about-highlights/new" className={styles.newLink}>New item</Link>
      </div>
      <p className={`body-small ${styles.helper}`}>
        The 3 items shown in the About page&apos;s Highlights section. Drag to
        reorder, or use the arrows.
      </p>

      {items.length === 0 ? (
        <p className={`body-default ${styles.empty}`}>No items yet.</p>
      ) : (
        <ReorderableList
          className={styles.list}
          itemClassName={styles.listItem}
          reorderUrl="/api/admin/about-highlights/reorder"
          items={items.map((item, index) => ({
            id: String(item.id),
            node: (
              <>
                <div className={styles.listItemMeta}>
                  <p className="body-default">
                    {item.title}
                    {!item.published && (
                      <span className={styles.unpublished}> — unpublished</span>
                    )}
                  </p>
                </div>
                <div className={styles.listItemActions}>
                  <form action={`/api/admin/about-highlights/${item.id}/move`} method="POST">
                    <input type="hidden" name="direction" value="up" />
                    <button type="submit" disabled={index === 0} aria-label="Move up">
                      ↑
                    </button>
                  </form>
                  <form action={`/api/admin/about-highlights/${item.id}/move`} method="POST">
                    <input type="hidden" name="direction" value="down" />
                    <button
                      type="submit"
                      disabled={index === items.length - 1}
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                  </form>
                  <Link href={`/admin/about-highlights/${item.id}`} className={styles.editLink}>
                    <span aria-hidden="true">✎</span><span className={styles.srOnly}>Edit highlight</span>
                  </Link>
                  <form
                    action={`/api/admin/about-highlights/${item.id}/delete`}
                    method="POST"
                    className={styles.deleteForm}
                  >
                    <button type="submit" className={styles.deleteButton} aria-label="Delete highlight" title="Delete highlight">
                      <span aria-hidden="true">×</span>
                    </button>
                  </form>
                </div>
              </>
            ),
          }))}
        />
      )}
    </>
  );
}
