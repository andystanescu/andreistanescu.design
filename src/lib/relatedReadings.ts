import { getCaseStudies } from "@/data/caseStudies";
import { getInsights } from "@/data/insights";

export type RelatedReadingType = "article" | "case_study";
export type RelatedReadingOption = { slug: string; title: string; contentType: RelatedReadingType };

export function getRelatedReadingOptions(exclude?: { slug: string; contentType: RelatedReadingType }): RelatedReadingOption[] {
  const options: RelatedReadingOption[] = [
    ...getInsights().map(({ slug, title }) => ({ slug, title, contentType: "article" as const })),
    ...getCaseStudies().map(({ slug, title }) => ({ slug, title, contentType: "case_study" as const })),
  ];
  return exclude ? options.filter((item) => item.slug !== exclude.slug || item.contentType !== exclude.contentType) : options;
}
