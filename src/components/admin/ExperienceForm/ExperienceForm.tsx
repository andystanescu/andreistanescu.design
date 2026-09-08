import type { AboutExperience } from "@/lib/about";
import styles from "@/app/admin/(dashboard)/admin.module.css";

type Props = { action: string; item?: AboutExperience };
const Field = ({ label, name, value, type = "text", required = false }: { label: string; name: string; value?: string; type?: string; required?: boolean }) => (
  <label className={styles.field}><span className="label-small" style={{ color: "var(--text-secondary)" }}>{label}</span><input className={styles.input} type={type} name={name} defaultValue={value ?? ""} required={required} /></label>
);

export function ExperienceForm({ action, item }: Props) {
  return <form className={styles.form} action={action} method="POST">
    <Field label="Start date" name="start_date" type="date" value={item?.start_date} required />
    <Field label="End date (leave empty for Present)" name="end_date" type="date" value={item?.end_date} />
    <Field label="Job title" name="job_title" value={item?.job_title} required />
    <Field label="Company name" name="company_name" value={item?.company_name} required />
    <Field label="Business profile" name="business_profile" value={item?.business_profile} required />
    <label className={styles.field}><span className="label-small" style={{ color: "var(--text-secondary)" }}>Description</span><textarea className={styles.textarea} name="description" defaultValue={item?.description ?? ""} required /></label>
    <label className={styles.checkboxField}><input type="checkbox" name="published" defaultChecked={item ? !!item.published : true} /><span className="body-default">Published</span></label>
    <div className={styles.formActions}><button type="submit" className={styles.submit}><span className="label-button">Save experience</span></button></div>
  </form>;
}
