import { addHeadingIds } from "@/lib/tableOfContents";

export const ASSESSMENT_BLOCK = '<aside data-assessment-block="true"></aside>';
const EDITOR_PLACEMENT_MARKER = '<!-- assessment-placement:editor -->';
const BLOCK_PATTERN = /<aside\b[^>]*\bdata-assessment-block="true"[^>]*>\s*<\/aside>/i;

export function hasEditorAssessmentPlacement(html: string) {
  return html.includes(EDITOR_PLACEMENT_MARKER);
}

export function markEditorAssessmentPlacement(html: string) {
  return `${html.replaceAll(EDITOR_PLACEMENT_MARKER, "").trim()}${EDITOR_PLACEMENT_MARKER}`;
}

export function splitAssessmentBlock(html: string) {
  const match = BLOCK_PATTERN.exec(html);
  return match ? { before: html.slice(0, match.index), after: html.slice(match.index + match[0].length) } : null;
}

/** Make a legacy automatic placement visible in the editor without changing the saved body. */
export function assessmentEditorBody(html: string, placement: string, hasAssessment: boolean) {
  const clean = html.replaceAll(EDITOR_PLACEMENT_MARKER, "");
  if (hasEditorAssessmentPlacement(html) || splitAssessmentBlock(clean) || !hasAssessment) return clean;
  if (placement !== "start") {
    const { html: withIds, toc } = addHeadingIds(clean);
    if (toc.some((heading) => heading.id === placement)) {
      const escaped = placement.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = new RegExp(`(<h[23]\\b(?=[^>]*\\bid="${escaped}")[^>]*>[\\s\\S]*?<\\/h[23]>)`, "i");
      return withIds.replace(pattern, `$1${ASSESSMENT_BLOCK}`);
    }
  }
  return `${ASSESSMENT_BLOCK}${clean}`;
}
