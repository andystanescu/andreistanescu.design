import Link from "next/link";
import { getAllExperiencesAdmin, getSection } from "@/lib/about";
import { AboutAdminHeader } from "@/components/admin/AboutAdminHeader/AboutAdminHeader";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

export default function AdminAboutExperiencesPage() {
  const experiences = getAllExperiencesAdmin();
  const section = getSection("before_conscept");
  return (
    <>
      <AboutAdminHeader active="/admin/about-experiences" />
      <div className={styles.contentTitleRow}>
        <p className="heading-02">Before ConScept</p>
        <Link href="/admin/about-experiences/new" className={styles.newLink}>New experience</Link>
      </div>
      {section && (
        <form className={styles.form} action="/api/admin/about/before_conscept" method="POST">
          <input type="hidden" name="return_tab" value="experiences" />
          <label className={styles.field}>
            <span className="label-small">Eyebrow</span>
            <input name="eyebrow" defaultValue={section.eyebrow} className={styles.input} />
          </label>
          <label className={styles.field}>
            <span className="label-small">Title</span>
            <input name="headline" defaultValue={section.headline} required className={styles.input} />
          </label>
          <input type="hidden" name="description" value={section.description} />
          <input type="hidden" name="visible" value={section.visible ? "on" : ""} />
          <div className={styles.formActions}>
            <button type="submit" className={styles.submit}>Save section</button>
          </div>
        </form>
      )}
      {experiences.length === 0 ? <p className={`body-default ${styles.empty}`}>No experiences yet.</p> : (
        <ul className={styles.list}>
          {experiences.map((item) => (
            <li key={item.id} className={styles.listItem}>
              <div className={styles.listItemMeta}>
                <p className="body-default">{item.job_title} — {item.company_name}{!item.published && <span className={styles.unpublished}> — unpublished</span>}</p>
                <p className="body-small">{item.start_date} — {item.end_date || "Present"}</p>
              </div>
              <div className={styles.listItemActions}>
                <Link href={`/admin/about-experiences/${item.id}`} className={styles.editLink} aria-label="Edit experience" title="Edit experience"><span aria-hidden="true">✎</span></Link>
                <form action={`/api/admin/about-experiences/${item.id}/delete`} method="POST" className={styles.deleteForm}>
                  <button type="submit" className={styles.deleteButton} aria-label="Delete experience" title="Delete experience"><span aria-hidden="true">×</span></button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
