"use client";

import { useState } from "react";
import styles from "./ImageField.module.css";

type ImageFieldProps = {
  name: string;
  currentUrl?: string;
};

// A file input with a live preview, for cover/thumbnail images on case
// study and article forms. Submits as a normal <input type="file"> inside
// the surrounding multipart form; the route handler saves it and keeps the
// existing image if no new file is chosen.
export function ImageField({ name, currentUrl }: ImageFieldProps) {
  const [preview, setPreview] = useState(currentUrl ?? "");

  return (
    <div className={styles.wrapper}>
      <div
        className={styles.preview}
        style={preview ? { backgroundImage: `url(${preview})` } : undefined}
        aria-hidden="true"
      />
      <input
        type="file"
        name={name}
        accept="image/*"
        className={styles.fileInput}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) setPreview(URL.createObjectURL(file));
        }}
      />
    </div>
  );
}
