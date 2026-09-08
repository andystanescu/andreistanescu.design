import Link from "next/link";
import { getAllApproachStepsAdmin } from "@/lib/approachSteps";
import { ReorderableList } from "@/components/admin/ReorderableList/ReorderableList";
import { AdminTabs } from "@/components/admin/AdminTabs/AdminTabs";
import { APPROACH_TABS } from "../adminTabs";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

export default function AdminApproachStepsPage() {
  const steps = getAllApproachStepsAdmin();

  return (
    <>
      <div className={styles.pageHeader}><h1 className="heading-01">Approach steps</h1><Link href="/admin/approach-steps/new" className={styles.newLink}>New step</Link></div>
      <AdminTabs tabs={APPROACH_TABS} active="/admin/approach-steps" />
      <div className={styles.toolbar}>
        <p className="heading-02">Listed steps</p>
      </div>
      <p className={`body-small ${styles.helper}`}>
        Listed in the How I work section on /about. Toggle &ldquo;Show on homepage&rdquo; on a
        step&apos;s edit screen to also feature it in the homepage Approach
        section. Drag to reorder, or use the arrows.
      </p>

      {steps.length === 0 ? (
        <p className={`body-default ${styles.empty}`}>No steps yet.</p>
      ) : (
        <ReorderableList
          className={styles.list}
          itemClassName={styles.listItem}
          reorderUrl="/api/admin/approach-steps/reorder"
          items={steps.map((step, index) => ({
            id: String(step.id),
            node: (
              <>
                <div className={styles.listItemMeta}>
                  <p className="body-default">
                    {step.title}
                    {!step.published && (
                      <span className={styles.unpublished}> — unpublished</span>
                    )}
                    {!!step.show_on_homepage && (
                      <span
                        className="body-small"
                        style={{ color: "var(--text-accent)", marginLeft: "var(--space-150)" }}
                      >
                        on homepage
                      </span>
                    )}
                  </p>
                </div>
                <div className={styles.listItemActions}>
                  <form action={`/api/admin/approach-steps/${step.id}/move`} method="POST">
                    <input type="hidden" name="direction" value="up" />
                    <button type="submit" disabled={index === 0} aria-label="Move up">
                      ↑
                    </button>
                  </form>
                  <form action={`/api/admin/approach-steps/${step.id}/move`} method="POST">
                    <input type="hidden" name="direction" value="down" />
                    <button
                      type="submit"
                      disabled={index === steps.length - 1}
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                  </form>
                  <Link href={`/admin/approach-steps/${step.id}`} className={styles.editLink}>
                    <span aria-hidden="true">✎</span><span className={styles.srOnly}>Edit approach step</span>
                  </Link>
                  <form
                    action={`/api/admin/approach-steps/${step.id}/delete`}
                    method="POST"
                    className={styles.deleteForm}
                  >
                    <button type="submit" className={styles.deleteButton} aria-label="Delete approach step" title="Delete approach step">
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
