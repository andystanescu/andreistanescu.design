import Link from "next/link";
import { AdminIcon } from "@/components/admin/AdminIcon/AdminIcon";
import { db } from "@/lib/db";
import type { Insight } from "@/data/insights";
import { ReorderableList } from "@/components/admin/ReorderableList/ReorderableList";
import { AdminTabs } from "@/components/admin/AdminTabs/AdminTabs";
import { ContentStatusFilter } from "@/components/admin/ContentStatusFilter/ContentStatusFilter";
import { INSIGHTS_TABS } from "../adminTabs";
import styles from "../admin.module.css";
import { ukDateTimeValue } from "@/lib/dateUtils";

export const dynamic = "force-dynamic";

export default async function AdminInsightsPage({ searchParams }: { searchParams: Promise<{ status?: string | string[] }> }) {
  const query = await searchParams;
  const status = query.status === "draft" ? "draft" : "published";
  const now = ukDateTimeValue();
  const allInsights = db
    .prepare("SELECT * FROM insights ORDER BY position ASC, id ASC")
    .all() as Insight[];
  const drafts = allInsights.filter((insight) => !insight.published);
  const published = allInsights.filter((insight) => Boolean(insight.published));
  const insights = status === "draft" ? drafts : published;

  return (
    <>
      <div className={styles.pageHeaderGroup}>
      <div className={styles.pageHeader}><h1 className="heading-01">Insights</h1><Link href="/admin/insights/new" className={styles.newLink}>New article</Link></div>
      <AdminTabs embedded tabs={INSIGHTS_TABS} active="/admin/insights" />
      </div>
      <ContentStatusFilter baseHref="/admin/insights" current={status} published={published.length} drafts={drafts.length} />
      <div className={styles.toolbar}>
        <p className="heading-02">{status === "draft" ? "Draft articles" : "Published articles"}</p>
      </div>

      {insights.length === 0 ? (
        <p className={`body-default ${styles.empty}`}>
          {status === "draft" ? "No article drafts." : <>No published articles yet. The homepage&apos;s &ldquo;Latest Insights&rdquo;
          section and /insights stay empty until you publish one.</>}
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
                    <span className={styles.unpublished}> — {insight.published && insight.scheduled_at && insight.scheduled_at > now ? "scheduled" : insight.published ? "published" : "draft"}</span>
                  </p>
                  <p className="body-small" style={{ color: "var(--text-tertiary)" }}>
                    /insights/{insight.slug} · {insight.published && insight.scheduled_at && insight.scheduled_at > now ? `publishes ${insight.scheduled_at.replace("T", " ")} UK time` : insight.published_at}
                  </p>
                </div>
                <div className={styles.listItemActions}>
                  {status === "published" && <form action={`/api/admin/insights/${insight.id}/move`} method="POST">
                    <input type="hidden" name="direction" value="up" />
                    <button type="submit" disabled={index === 0} aria-label="Move up"><AdminIcon name="direction-arrow-up" /></button>
                  </form>}
                  {status === "published" && <form action={`/api/admin/insights/${insight.id}/move`} method="POST">
                    <input type="hidden" name="direction" value="down" />
                    <button
                      type="submit"
                      disabled={index === insights.length - 1}
                      aria-label="Move down"
                    ><AdminIcon name="direction-arrow-down" /></button>
                  </form>}
                  <Link href={`/admin/insights/${insight.id}`} className={styles.editLink}>
                    <AdminIcon name="action-edit" />
                    <span className={styles.srOnly}>Edit article</span>
                  </Link>
                  <form
                    action={`/api/admin/insights/${insight.id}/delete`}
                    method="POST"
                    className={styles.deleteForm}
                  >
                    <button type="submit" className={styles.deleteButton} aria-label="Delete article" title="Delete article">
                      <AdminIcon name="action-delete" />
                    </button>
                  </form>
                  <form action={`/api/admin/insights/${insight.id}/toggle`} method="POST">
                    <button type="submit" className={`${styles.publishSwitch} ${insight.published ? styles.publishSwitchOn : ""}`} aria-label={insight.published ? "Unpublish article" : "Publish article"} aria-pressed={Boolean(insight.published)} title={insight.published ? "Unpublish article" : "Publish article"}>
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
