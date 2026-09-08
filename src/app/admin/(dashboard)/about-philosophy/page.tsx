import Link from "next/link";
import { getAllPhilosophyItemsAdmin } from "@/lib/about";
import { ReorderableList } from "@/components/admin/ReorderableList/ReorderableList";
import { AboutAdminHeader } from "@/components/admin/AboutAdminHeader/AboutAdminHeader";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

export default function AdminAboutPhilosophyPage() {
  const items = getAllPhilosophyItemsAdmin();

  return (
    <>
      <AboutAdminHeader active="/admin/about-philosophy" />
      <div className={styles.contentTitleRow}>
        <p className="heading-02">Philosophy</p>
        <Link href="/admin/about-philosophy/new" className={styles.newLink}>New item</Link>
      </div>
      <p className={`body-small ${styles.helper}`}>
        The 4 items shown in the About page&apos;s Philosophy section. Drag to
        reorder, or use the arrows.
      </p>

      {items.length === 0 ? (
        <p className={`body-default ${styles.empty}`}>No items yet.</p>
      ) : (
        <ReorderableList
          className={styles.list}
          itemClassName={styles.listItem}
          reorderUrl="/api/admin/about-philosophy/reorder"
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
                  <form action={`/api/admin/about-philosophy/${item.id}/move`} method="POST">
                    <input type="hidden" name="direction" value="up" />
                    <button type="submit" disabled={index === 0} aria-label="Move up">
                      ↑
                    </button>
                  </form>
                  <form action={`/api/admin/about-philosophy/${item.id}/move`} method="POST">
                    <input type="hidden" name="direction" value="down" />
                    <button
                      type="submit"
                      disabled={index === items.length - 1}
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                  </form>
                  <Link href={`/admin/about-philosophy/${item.id}`} className={styles.editLink}>
                    <span aria-hidden="true">✎</span><span className={styles.srOnly}>Edit philosophy item</span>
                  </Link>
                  <form
                    action={`/api/admin/about-philosophy/${item.id}/delete`}
                    method="POST"
                    className={styles.deleteForm}
                  >
                    <button type="submit" className={styles.deleteButton} aria-label="Delete philosophy item" title="Delete philosophy item">
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
