import Link from "next/link";
import { AdminIcon } from "@/components/admin/AdminIcon/AdminIcon";
import { db } from "@/lib/db";
import type { CaseStudy } from "@/data/caseStudies";
import { ReorderableList } from "@/components/admin/ReorderableList/ReorderableList";
import { AdminTabs } from "@/components/admin/AdminTabs/AdminTabs";
import { ContentStatusFilter } from "@/components/admin/ContentStatusFilter/ContentStatusFilter";
import { CASE_STUDIES_TABS } from "../adminTabs";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

export default async function AdminCaseStudiesPage({ searchParams }: { searchParams: Promise<{ status?: string | string[] }> }) {
  const query = await searchParams;
  const status = query.status === "draft" ? "draft" : "published";
  const allCaseStudies = db
    .prepare("SELECT * FROM case_studies ORDER BY position ASC, id ASC")
    .all() as CaseStudy[];
  const drafts = allCaseStudies.filter((study) => !study.published);
  const published = allCaseStudies.filter((study) => Boolean(study.published));
  const caseStudies = status === "draft" ? drafts : published;

  return (
    <>
      <div className={styles.pageHeaderGroup}>
      <div className={styles.pageHeader}><h1 className="heading-01">Case studies</h1><Link href="/admin/case-studies/new" className={styles.newLink}>New case study</Link></div>
      <AdminTabs embedded tabs={CASE_STUDIES_TABS} active="/admin/case-studies" />
      </div>
      <ContentStatusFilter baseHref="/admin/case-studies" current={status} published={published.length} drafts={drafts.length} />
      <div className={styles.toolbar}>
        <p className="heading-02">{status === "draft" ? "Draft case studies" : "Published case studies"}</p>
      </div>

      {caseStudies.length === 0 ? (
        <p className={`body-default ${styles.empty}`}>
          {status === "draft" ? "No case-study drafts." : <>No published case studies yet. The homepage&apos;s &ldquo;Selected Impact&rdquo;
          section stays hidden until you add one.</>}
        </p>
      ) : (
        <ReorderableList
          key={status}
          className={styles.list}
          itemClassName={styles.listItem}
          reorderUrl="/api/admin/case-studies/reorder"
          items={caseStudies.map((study, index) => ({
            id: String(study.id),
            editHref: `/admin/case-studies/${study.id}`,
            node: (
              <>
                <div className={styles.listItemMeta}>
                  <p className="body-default">
                    {study.title}
                    <span className={styles.unpublished}> — {study.published ? study.in_progress ? "published · in progress" : "published" : "draft"}</span>
                    {study.body_draft !== null && (
                      <span className={styles.unpublished}> — body draft</span>
                    )}
                  </p>
                  <p className="body-small" style={{ color: "var(--text-tertiary)" }}>
                    /work/{study.slug}
                  </p>
                </div>
                <div className={styles.listItemActions}>
                  {status === "published" && <form action={`/api/admin/case-studies/${study.id}/move`} method="POST">
                    <input type="hidden" name="direction" value="up" />
                    <button type="submit" disabled={index === 0} aria-label="Move up"><AdminIcon name="direction-arrow-up" /></button>
                  </form>}
                  {status === "published" && <form action={`/api/admin/case-studies/${study.id}/move`} method="POST">
                    <input type="hidden" name="direction" value="down" />
                    <button
                      type="submit"
                      disabled={index === caseStudies.length - 1}
                      aria-label="Move down"
                    ><AdminIcon name="direction-arrow-down" /></button>
                  </form>}
                  <Link href={`/admin/case-studies/${study.id}`} className={styles.editLink}>
                    <AdminIcon name="action-edit" />
                    <span className={styles.srOnly}>Edit case study</span>
                  </Link>
                  <form
                    action={`/api/admin/case-studies/${study.id}/delete`}
                    method="POST"
                    className={styles.deleteForm}
                  >
                    <button type="submit" className={styles.deleteButton} aria-label="Delete case study" title="Delete case study">
                      <AdminIcon name="action-delete" />
                    </button>
                  </form>
                  <form action={`/api/admin/case-studies/${study.id}/toggle`} method="POST">
                    <button type="submit" className={`${styles.publishSwitch} ${study.published ? styles.publishSwitchOn : ""}`} aria-label={study.published ? "Unpublish case study" : "Publish case study"} aria-pressed={Boolean(study.published)} title={study.published ? "Unpublish case study" : "Publish case study"}>
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
