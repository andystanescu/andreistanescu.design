import { highlightCodeBlocks } from "@/lib/highlightCode";
import { splitInteractiveBlocks } from "@/lib/interactiveBlocks";
import { LiveComponentBlock } from "@/components/LiveComponentBlock/LiveComponentBlock";
import styles from "./RichContent.module.css";

type RichContentProps = {
  html: string;
};

// Renders HTML written in the admin panel's rich text editor. Safe to
// render directly: this content only ever comes from an authenticated
// admin session, never from public user input.
export function RichContent({ html }: RichContentProps) {
  if (!html.trim()) return null;

  const segments = splitInteractiveBlocks(html);
  const hasLiveBlocks = segments.some((segment) => segment.type === "live");

  // The common case (no "⚡ Live" blocks) stays exactly as before — a
  // single dangerouslySetInnerHTML, no extra wrapper markup.
  if (!hasLiveBlocks) {
    return (
      <div
        className={styles.content}
        dangerouslySetInnerHTML={{ __html: highlightCodeBlocks(html) }}
      />
    );
  }

  return (
    <div className={styles.content}>
      {segments.map((segment, index) =>
        segment.type === "live" ? (
          <LiveComponentBlock key={index} code={segment.code} chrome={segment.chrome} />
        ) : segment.content.trim() ? (
          <div
            key={index}
            className={styles.content}
            dangerouslySetInnerHTML={{ __html: highlightCodeBlocks(segment.content) }}
          />
        ) : null
      )}
    </div>
  );
}
