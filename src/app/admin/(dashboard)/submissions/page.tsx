import { listSubmissions } from "@/lib/submissions";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

export default function AdminSubmissionsPage() {
  const submissions = listSubmissions();

  return (
    <>
      <h1 className="heading-01">Form submissions</h1>

      {submissions.length === 0 ? (
        <p className={`body-default ${styles.empty}`}>
          No one has submitted the contact form yet.
        </p>
      ) : (
        <ul className={styles.list} style={{ maxWidth: 720 }}>
          {submissions.map((submission) => (
            <li key={submission.id} className={styles.listItem}>
              <div className={styles.listItemMeta} style={{ width: "100%" }}>
                <p className="body-default">
                  {submission.name} · {submission.email}
                </p>
                <p className="body-small" style={{ color: "var(--text-secondary)" }}>
                  {submission.message}
                </p>
                <p className="body-small" style={{ color: "var(--text-tertiary)" }}>
                  {submission.created_at}
                  {submission.newsletter ? " · subscribed to newsletter" : ""}
                  {submission.emailed
                    ? " · emailed"
                    : submission.email_error
                      ? ` · email failed: ${submission.email_error}`
                      : " · not emailed"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
