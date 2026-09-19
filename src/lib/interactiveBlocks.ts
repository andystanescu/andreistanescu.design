function decodeEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

export type ContentSegment =
  | { type: "html"; content: string }
  | { type: "live"; code: string; chrome: "framed" | "minimal"; runtime: "auto" | "react" | "html" | "static"; language?: string }
  | { type: "relatedInsight"; slug: string; contentType: "article" | "case_study" }
  | { type: "gallery"; images: Array<{ src: string; alt?: string; caption?: string }> };

export type RelatedReadingReference = { slug: string; contentType: "article" | "case_study" };

// A code block toggled "⚡ Live" in the editor (RichTextEditor's
// InteractiveCodeBlock) round-trips as <pre data-interactive="true">. This
// pulls those out of the HTML string so RichContent can render them as a
// real running React component instead of highlighted text — the rest of
// the content stays a plain HTML string, unaffected.
export function splitInteractiveBlocks(html: string): ContentSegment[] {
  const re = /<pre data-interactive="true"([^>]*)><code(?:\s+class="language-([^"]+)")?>([\s\S]*?)<\/code><\/pre>|<aside data-related-insight="([^"]+)"([^>]*)><\/aside>|<aside data-image-gallery="([^"]+)"><\/aside>/g;
  const segments: ContentSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(html))) {
    if (match.index > lastIndex) {
      segments.push({ type: "html", content: html.slice(lastIndex, match.index) });
    }
    if (match[4]) {
      const contentType = /data-content-type="case_study"/.test(match[5] || "") ? "case_study" : "article";
      segments.push({ type: "relatedInsight", slug: decodeEntities(match[4]), contentType });
    } else if (match[6]) {
      try {
        const images = JSON.parse(decodeURIComponent(decodeEntities(match[6])));
        if (Array.isArray(images)) segments.push({ type: "gallery", images });
      } catch { /* Ignore malformed legacy content without breaking the article. */ }
    } else {
      const runtimeMatch = (match[1] || "").match(/data-runtime="(auto|react|html|static)"/);
      const chromeMatch = (match[1] || "").match(/data-chrome="(minimal|framed)"/);
      segments.push({ type: "live", chrome: chromeMatch?.[1] === "minimal" ? "minimal" : "framed", runtime: (runtimeMatch?.[1] as "auto" | "react" | "html" | "static" | undefined) ?? "auto", language: match[2], code: decodeEntities(match[3]) });
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < html.length) {
    segments.push({ type: "html", content: html.slice(lastIndex) });
  }
  return segments;
}

export function getRelatedReadingReferences(html: string): RelatedReadingReference[] {
  return splitInteractiveBlocks(html)
    .filter((segment): segment is Extract<ContentSegment, { type: "relatedInsight" }> => segment.type === "relatedInsight")
    .map(({ slug, contentType }) => ({ slug, contentType }));
}
