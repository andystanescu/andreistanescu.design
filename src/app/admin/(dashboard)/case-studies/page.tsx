import Link from "next/link";
import { db } from "@/lib/db";
import type { CaseStudy } from "@/data/caseStudies";
import { ReorderableList } from "@/components/admin/ReorderableList/ReorderableList";
import { AdminTabs } from "@/components/admin/AdminTabs/AdminTabs";
import { CASE_STUDIES_TABS } from "../adminTabs";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

export default function AdminCaseStudiesPage() {
  const caseStudies = db
    .prepare("SELECT * FROM case_studies ORDER BY position ASC, id ASC")
    .all() as CaseStudy[];

  return (
    <>
      <div className={styles.pageHeader}><h1 className="heading-01">Case studies</h1><Link href="/admin/case-studies/new" className={styles.newLink}>New case study</Link></div>
      <AdminTabs tabs={CASE_STUDIES_TABS} active="/admin/case-studies" />
      <div className={styles.toolbar}>
        <p className="heading-02">Listed case studies</p>
      </div>

      {caseStudies.length === 0 ? (
        <p className={`body-default ${styles.empty}`}>
          No case studies yet. The homepage&apos;s &ldquo;Selected Impact&rdquo;
          section stays hidden until you add one.
        </p>
      ) : (
        <ReorderableList
          className={styles.list}
          itemClassName={styles.listItem}
          reorderUrl="/api/admin/case-studies/reorder"
          items={caseStudies.map((study, index) => ({
            id: String(study.id),
            node: (
              <>
                <div className={styles.listItemMeta}>
                  <p className="body-default">
                    {study.title}
                    {!study.published && (
                      <span className={styles.unpublished}> — unpublished</span>
                    )}
                  </p>
                  <p className="body-small" style={{ color: "var(--text-tertiary)" }}>
                    /work/{study.slug}
                  </p>
                </div>
                <div className={styles.listItemActions}>
                  <form action={`/api/admin/case-studies/${study.id}/move`} method="POST">
                    <input type="hidden" name="direction" value="up" />
                    <button type="submit" disabled={index === 0} aria-label="Move up">
                      ↑
                    </button>
                  </form>
                  <form action={`/api/admin/case-studies/${study.id}/move`} method="POST">
                    <input type="hidden" name="direction" value="down" />
                    <button
                      type="submit"
                      disabled={index === caseStudies.length - 1}
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                  </form>
                  <Link href={`/admin/case-studies/${study.id}`} className={styles.editLink}>
                    <span aria-hidden="true">✎</span>
                    <span className={styles.srOnly}>Edit case study</span>
                  </Link>
                  <form
                    action={`/api/admin/case-studies/${study.id}/delete`}
                    method="POST"
                    className={styles.deleteForm}
                  >
                    <button type="submit" className={styles.deleteButton} aria-label="Delete case study" title="Delete case study">
                      <span aria-hidden="true">×</span>
                    </button>
                  </form>
                  <form action={`/api/admin/case-studies/${study.id}/toggle`} method="POST">
                    <button type="submit" className={`${styles.publishSwitch} ${study.published ? styles.publishSwitchOn : ""}`} aria-label={study.published ? "Unpublish case study" : "Publish case study"} title={study.published ? "Unpublish case study" : "Publish case study"}>
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
