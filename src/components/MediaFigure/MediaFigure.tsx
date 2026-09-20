import type { ReactNode } from "react";
import { MediaContainer, type MediaVariant } from "@/components/MediaContainer/MediaContainer";
import styles from "./MediaFigure.module.css";

export function MediaFigure({ media, caption, context, variant = "contained" }: { media: ReactNode; caption?: ReactNode; context?: ReactNode; variant?: MediaVariant }) {
  return (
    <MediaContainer variant={variant}>
      <figure className={styles.figure}>
        <div className={styles.media}>{media}</div>
        {(caption || context) && <figcaption className={styles.caption}>
          {caption && <span>{caption}</span>}
          {context && <small>{context}</small>}
        </figcaption>}
      </figure>
    </MediaContainer>
  );
}
