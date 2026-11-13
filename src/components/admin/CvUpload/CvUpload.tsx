"use client";

import { useRef, useState } from "react";
import { AdminIcon } from "@/components/admin/AdminIcon/AdminIcon";
import styles from "./CvUpload.module.css";

function formatSize(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function CvUpload({ currentUrl, currentName, currentSize }: { currentUrl: string; currentName: string; currentSize: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [removed, setRemoved] = useState(false);
  const [error, setError] = useState("");
  const hasSaved = Boolean(currentUrl) && !removed;
  const hasFile = Boolean(file) || hasSaved;
  const filename = file?.name || (hasSaved ? currentName || "Current CV.pdf" : "No file chosen");
  const size = file?.size ?? (hasSaved ? Number(currentSize) : 0);

  return <div className={styles.root}>
    <span className="label-small">CV (PDF)</span>
    <div className={styles.box}>
      <div className={styles.fileRow}>
        <span className={styles.fileIcon}><AdminIcon name="icon-cv" className={styles.icon} /></span>
        <div className={styles.fileInfo}>
          {hasSaved && !file ? <a className={styles.fileName} href={currentUrl} target="_blank" rel="noreferrer" title={filename}>{filename}</a> : <span className={styles.fileName} title={filename}>{filename}</span>}
          <span className={styles.fileDetails}>PDF{size > 0 ? ` · ${formatSize(size)}` : hasFile ? "" : " · up to 5 MB"}</span>
        </div>
        <div className={styles.actions}>
          <button type="button" className={`${styles.choose} ${hasFile ? styles.replace : ""}`} onClick={() => inputRef.current?.click()}>{hasFile ? "Replace" : "Choose file"}</button>
          {hasFile && <button type="button" className={styles.remove} onClick={() => { if (inputRef.current) inputRef.current.value = ""; setFile(null); setRemoved(true); setError(""); }}>Remove</button>}
        </div>
      </div>
    </div>
    <input ref={inputRef} className={styles.input} type="file" name="about_cv" accept="application/pdf,.pdf" tabIndex={-1} aria-label="Upload CV PDF" onChange={(event) => {
      const selected = event.target.files?.[0];
      if (!selected) return;
      if (selected.type !== "application/pdf" || selected.size > 5 * 1024 * 1024) { setError("Choose a PDF no larger than 5 MB."); event.target.value = ""; setFile(null); return; }
      setFile(selected); setRemoved(false); setError("");
    }} />
    <input type="hidden" name="about_cv_remove" value={removed ? "1" : "0"} />
    <span className={styles.helper}>Shown as a download button in the About hero. Save the section to apply changes.</span>
    {error && <span className={styles.error} role="alert">{error}</span>}
  </div>;
}
