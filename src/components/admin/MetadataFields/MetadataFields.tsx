import styles from "@/app/admin/(dashboard)/admin.module.css";

type MetadataValues = { meta_title?: string; meta_description?: string; meta_keywords?: string; canonical_url?: string; og_image?: string; thumbnail_image?: string; no_index?: number };

export function MetadataFields({ values = {} }: { values?: MetadataValues }) {
  return <div className={styles.metadataGrid}>
    <label className={styles.field}><span className="label-small">Meta title</span><input name="meta_title" defaultValue={values.meta_title || ""} maxLength={60} placeholder="Optional SEO title" className={styles.input} /><small className="body-small">Use a clear, specific title. Leave blank to use the page title.</small></label>
    <label className={styles.field}><span className="label-small">Meta description</span><textarea name="meta_description" defaultValue={values.meta_description || ""} maxLength={160} placeholder="Optional search-result description" className={styles.textarea} /><small className="body-small">Aim for a useful summary of up to 160 characters.</small></label>
    <label className={styles.field}><span className="label-small">Search keywords</span><input name="meta_keywords" defaultValue={values.meta_keywords || ""} placeholder="systems, product design, strategy" className={styles.input} /><small className="body-small">Optional comma-separated terms. These support editing and content planning.</small></label>
    <label className={styles.field}><span className="label-small">Canonical URL</span><input type="url" name="canonical_url" defaultValue={values.canonical_url || ""} placeholder="https://andreistanescu.design/page" className={styles.input} /><small className="body-small">Leave blank to use this page’s normal URL.</small></label>
    <label className={styles.field}><span className="label-small">Social sharing image URL</span><input type="text" name="og_image" defaultValue={values.og_image || values.thumbnail_image || ""} placeholder="Uses the thumbnail by default" className={styles.input} /><small className="body-small">Uses the thumbnail automatically unless you enter a different image.</small></label>
    <label className={styles.checkboxField}><input type="checkbox" name="no_index" defaultChecked={values.no_index === 1} /><span className={styles.switch} aria-hidden="true" /><span className="body-default">Ask search engines not to index this page</span></label>
  </div>;
}
