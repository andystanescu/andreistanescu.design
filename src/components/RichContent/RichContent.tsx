import { highlightCodeBlocks } from "@/lib/highlightCode";
import { splitInteractiveBlocks } from "@/lib/interactiveBlocks";
import { LiveComponentBlock } from "@/components/LiveComponentBlock/LiveComponentBlock";
import { RelatedInsightCard } from "@/components/RelatedInsightCard/RelatedInsightCard";
import { ImageGallery } from "@/components/ImageGallery/ImageGallery";
import { MediaContainer } from "@/components/MediaContainer/MediaContainer";
import { BeforeAfterComparison } from "@/components/BeforeAfterComparison/BeforeAfterComparison";
import { CodeBlockContent } from "@/components/CodeBlock/CodeBlockContent";
import { EmbedWrapper } from "@/components/EmbedWrapper/EmbedWrapper";
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
  const hasLiveBlocks = segments.some((segment) => segment.type !== "html");

  // The common case (no "⚡ Live" blocks) stays exactly as before — a
  // single dangerouslySetInnerHTML, no extra wrapper markup.
  if (!hasLiveBlocks) {
    return (
      <CodeBlockContent className={styles.content} html={highlightCodeBlocks(html)} />
    );
  }

  return (
    <div className={styles.content}>
      {segments.map((segment, index) =>
        segment.type === "live" ? (
          <MediaContainer key={index} variant={segment.mediaVariant}><EmbedWrapper label={segment.label} help={segment.help}><LiveComponentBlock code={segment.code} chrome={segment.chrome} runtime={segment.runtime} language={segment.language} /></EmbedWrapper></MediaContainer>
        ) : segment.type === "relatedInsight" ? (
          <RelatedInsightCard key={index} slug={segment.slug} contentType={segment.contentType} />
        ) : segment.type === "gallery" ? (
          <MediaContainer key={index} variant={segment.mediaVariant}><ImageGallery images={segment.images} /></MediaContainer>
        ) : segment.type === "beforeAfter" ? (
          <MediaContainer key={index} variant={segment.mediaVariant}><BeforeAfterComparison before={segment.before} after={segment.after} /></MediaContainer>
        ) : segment.content.trim() ? (
          <CodeBlockContent key={index} className={styles.content} html={highlightCodeBlocks(segment.content)} />
        ) : null
      )}
    </div>
  );
}
