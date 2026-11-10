import Link from "next/link";
import { listSubmissions } from "@/lib/submissions";
import { SubmissionActions } from "@/components/admin/SubmissionActions/SubmissionActions";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";
type Category = "submitted" | "failed" | "blocked";
const categories: Category[] = ["submitted", "failed", "blocked"];

export default async function AdminSubmissionsPage({ searchParams }: { searchParams: Promise<{ category?: string; result?: string }> }) {
  const query = await searchParams;
  const category: Category = categories.find((item) => item === query.category) ?? "submitted";
  const submissions = listSubmissions(true);
  const grouped = {
    submitted: submissions.filter((item) => !item.blocked && item.emailed),
    failed: submissions.filter((item) => !item.blocked && !item.emailed),
    blocked: submissions.filter((item) => item.blocked),
  };
  const descriptions = {
    submitted: "Notifications accepted by the email provider. Delivery to the inbox is not confirmed.",
    failed: "Notifications that have not been sent. Retry after resolving the delivery issue.",
    blocked: "Submissions caught by the contact form’s honeypot. Unblocking moves them to Failed for review and an optional retry.",
  };
  const messages: Record<string, string> = { deleted: "Submission deleted.", unblocked: "Submission unblocked and moved to Failed. Retry when ready.", retried: "Notification accepted by the email provider.", "retry-failed": "The notification could not be sent. See the delivery error below." };

  return <>
    <div className={`${styles.pageHeader} ${styles.pageHeaderStacked}`}><h1 className="heading-01">Form submissions</h1><p className={`body-small ${styles.helper}`}>Review contact messages and their notification status.</p></div>
    <nav className={styles.submissionTabs} aria-label="Submission categories">{categories.map((item) => <Link key={item} href={`/admin/submissions?category=${item}`} aria-current={category === item ? "page" : undefined} className={`${styles.submissionTab} ${category === item ? styles.submissionTabActive : ""}`}><span>{item[0].toUpperCase() + item.slice(1)}</span><span>{grouped[item].length}</span></Link>)}</nav>
    {query.result && messages[query.result] && <p role="status" className="body-small">{messages[query.result]}</p>}
    <p className={`body-small ${styles.helper}`}>{descriptions[category]}</p>
    {grouped[category].length === 0 ? <p className={`body-default ${styles.empty}`}>No {category} submissions.</p> : <ul className={`${styles.list} ${styles.submissionsList}`}>
      {grouped[category].map((submission) => <li id={`submission-${submission.id}`} key={submission.id} className={`${styles.listItem} ${styles.submissionItem}`}>
        <div className={styles.listItemMeta}>
          <p className="body-default">{submission.name || "Name not provided"} · {submission.email || "Email not provided"}</p>
          <p className="body-small" style={{ color: "var(--text-secondary)", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{submission.message || "No message provided."}</p>
          <p className="body-small" style={{ color: "var(--text-tertiary)" }}>{submission.created_at}{submission.newsletter ? " · subscribed to newsletter" : ""}{category === "failed" && submission.email_error ? ` · ${submission.email_error}` : ""}</p>
        </div>
        <SubmissionActions id={submission.id} category={category} />
      </li>)}
    </ul>}
  </>;
}
