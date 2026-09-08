import Link from "next/link";
import { db } from "@/lib/db";
import type { Insight } from "@/data/insights";
import { ReorderableList } from "@/components/admin/ReorderableList/ReorderableList";
import { AdminTabs } from "@/components/admin/AdminTabs/AdminTabs";
import { INSIGHTS_TABS } from "../adminTabs";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

export default function AdminInsightsPage() {
  const insights = db
    .prepare("SELECT * FROM insights ORDER BY position ASC, id ASC")
    .all() as Insight[];

  return (
    <>
      <div className={styles.pageHeader}><h1 className="heading-01">Insights</h1><Link href="/admin/insights/new" className={styles.newLink}>New article</Link></div>
      <AdminTabs tabs={INSIGHTS_TABS} active="/admin/insights" />
      <div className={styles.toolbar}>
        <p className="heading-02">Published articles</p>
      </div>

      {insights.length === 0 ? (
        <p className={`body-default ${styles.empty}`}>
          No articles yet. The homepage&apos;s &ldquo;Latest Insights&rdquo;
          section and /insights stay empty until you publish one.
        </p>
      ) : (
        <ReorderableList
          className={styles.list}
          itemClassName={styles.listItem}
          reorderUrl="/api/admin/insights/reorder"
          items={insights.map((insight, index) => ({
            id: String(insight.id),
            node: (
              <>
                <div className={styles.listItemMeta}>
                  <p className="body-default">
                    {insight.title}
                    {!insight.published && (
                      <span className={styles.unpublished}> — unpublished</span>
                    )}
                  </p>
                  <p className="body-small" style={{ color: "var(--text-tertiary)" }}>
                    /insights/{insight.slug} · {insight.published_at}
                  </p>
                </div>
                <div className={styles.listItemActions}>
                  <form action={`/api/admin/insights/${insight.id}/move`} method="POST">
                    <input type="hidden" name="direction" value="up" />
                    <button type="submit" disabled={index === 0} aria-label="Move up">
                      ↑
                    </button>
                  </form>
                  <form action={`/api/admin/insights/${insight.id}/move`} method="POST">
                    <input type="hidden" name="direction" value="down" />
                    <button
                      type="submit"
                      disabled={index === insights.length - 1}
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                  </form>
                  <Link href={`/admin/insights/${insight.id}`} className={styles.editLink}>
                    <span aria-hidden="true">✎</span>
                    <span className={styles.srOnly}>Edit article</span>
                  </Link>
                  <form
                    action={`/api/admin/insights/${insight.id}/delete`}
                    method="POST"
                    className={styles.deleteForm}
                  >
                    <button type="submit" className={styles.deleteButton} aria-label="Delete article" title="Delete article">
                      <span aria-hidden="true">×</span>
                    </button>
                  </form>
                  <form action={`/api/admin/insights/${insight.id}/toggle`} method="POST">
                    <button type="submit" className={`${styles.publishSwitch} ${insight.published ? styles.publishSwitchOn : ""}`} aria-label={insight.published ? "Unpublish article" : "Publish article"} title={insight.published ? "Unpublish article" : "Publish article"}>
                      <span className={styles.publishSwitchKnob} aria-hidden="true" />
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
