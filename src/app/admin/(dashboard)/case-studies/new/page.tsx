import { getExistingTags } from "@/lib/existingTags";
import { CaseStudyEditor } from "@/components/admin/CaseStudyEditor/CaseStudyEditor";
import { getCategories } from "@/lib/categories";
import { getSettings } from "@/lib/settings";
import type { CaseStudy } from "@/data/caseStudies";
import { getRelatedReadingOptions } from "@/lib/relatedReadings";

export default async function NewCaseStudyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const settings = getSettings();
  const blankStudy = {
    id: 0, slug: "", eyebrow: "", category: "", year: "", project_role: "", contribution: "", timeline: "", scope: "", team: "", title: "", description: "", tags: "", body: "", body_draft: null, body_draft_enabled: 0,
    cover_image: "", thumbnail_image: "", position: 0, published: 0, in_progress: 0, outcome_eyebrow: "OUTCOMES", outcome_title: "",
    metrics: "[]", assessment: "{}", password_required: 0, password_hashes: "[]", author: settings.author_name,
    published_at: "", meta_title: "", meta_description: "", meta_keywords: "", canonical_url: "", og_image: "", no_index: 0,
  } satisfies CaseStudy;
  const assessment = { scores: {}, likelyEngagement: [], conducted: [], conductedEngagementIds: [], notApplicable: [], overall: "", overallDescription: "", primaryDrivers: [], placement: "start" };
  const categories = getCategories().map((category) => ({ ...category }));
  const relatedReadings = getRelatedReadingOptions();

  return <>
    {error && <p style={{ color: "var(--border-error)" }}>{error}</p>}
    <CaseStudyEditor
      existingTags={getExistingTags()}
      study={blankStudy}
      metrics={[]}
      assessment={assessment}
      categories={categories}
      selectedCategoryIds={[]}
      relatedReadings={relatedReadings}
      passwordRequired={false}
      passwordEntries={[]}
      authorAvatarUrl={settings.about_hero_image}
      action="/api/admin/case-studies"
    />
  </>;
}
