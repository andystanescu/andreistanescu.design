import { getCaseStudies } from "@/data/caseStudies";
import { getCaseStudyBySlug } from "@/data/caseStudies";
import { getInsights } from "@/data/insights";
import { getInsightBySlug } from "@/data/insights";
import type { RelatedReadingReference } from "@/lib/interactiveBlocks";
import { calculateReadingTime } from "@/lib/readingTime";

export type RelatedReadingType = "article" | "case_study";
export type RelatedReadingOption = { slug: string; title: string; contentType: RelatedReadingType };
export type ResolvedRelatedReading = RelatedReadingOption & { href: string; minutes: number };

export function getRelatedReadingOptions(exclude?: { slug: string; contentType: RelatedReadingType }): RelatedReadingOption[] {
  const options: RelatedReadingOption[] = [
    ...getInsights().map(({ slug, title }) => ({ slug, title, contentType: "article" as const })),
    ...getCaseStudies().map(({ slug, title }) => ({ slug, title, contentType: "case_study" as const })),
  ];
  return exclude ? options.filter((item) => item.slug !== exclude.slug || item.contentType !== exclude.contentType) : options;
}

export function resolveRelatedReadings(items: RelatedReadingReference[]): ResolvedRelatedReading[] {
  return items.flatMap((item) => {
    const content = item.contentType === "case_study" ? getCaseStudyBySlug(item.slug) : getInsightBySlug(item.slug);
    if (!content) return [];
    return [{
      ...item,
      title: content.title,
      minutes: calculateReadingTime(content.body),
      href: item.contentType === "case_study" ? `/work/${encodeURIComponent(content.slug)}` : `/insights/${encodeURIComponent(content.slug)}`,
    }];
  });
}
