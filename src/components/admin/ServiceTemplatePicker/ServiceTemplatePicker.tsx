"use client";

import { useState } from "react";
import styles from "@/components/insights/InsightsListing/InsightsListing.module.css";
import navigationStyles from "@/components/admin/NavigationPreview/NavigationPreview.module.css";

export function ServiceTemplatePicker({ initial, templates, onChange }: { initial: string; templates: readonly (readonly [string, string])[]; onChange?: (template: string) => void }) {
  const [selected, setSelected] = useState(initial);
  return <fieldset className={navigationStyles.styleOptions}>
    <legend>Service page template</legend>
    <input type="hidden" name="template_key" value={selected} />
    <div className={styles.filters}>{templates.map(([key, label]) => <button type="button" key={key} className={selected === key ? styles.filterActive : styles.filter} aria-pressed={selected === key} onClick={() => { setSelected(key); onChange?.(key); }}>{label}</button>)}</div>
    <p className="body-small">Templates include their original section copy. The editable sections are shown below.</p>
  </fieldset>;
}
