import { CaseStudyEditor } from "@/components/admin/CaseStudyEditor/CaseStudyEditor";
import { getServiceItems } from "@/lib/serviceItems";
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
    id: 0, slug: "", eyebrow: "", category: "", year: "", project_role: "", timeline: "", scope: "", team: "", title: "", description: "", tags: "", body: "", body_draft: null, body_draft_enabled: 0,
    cover_image: "", thumbnail_image: "", position: 0, published: 0, in_progress: 0, outcome_eyebrow: "OUTCOMES", outcome_title: "",
    metrics: "[]", assessment: "{}", password_required: 0, password_hashes: "[]", author: settings.author_name,
    published_at: "", meta_title: "", meta_description: "", meta_keywords: "", canonical_url: "", og_image: "", no_index: 0,
  } satisfies CaseStudy;
  const assessment = { scores: {}, likelyEngagement: [], conducted: [], notApplicable: [], overall: "", overallDescription: "", primaryDrivers: [] };
  const services = getServiceItems().map((service) => ({ slug: service.slug, title: service.title }));
  const relatedReadings = getRelatedReadingOptions();

  return <>
    {error && <p style={{ color: "var(--border-error)" }}>{error}</p>}
    <CaseStudyEditor
      study={blankStudy}
      metrics={[]}
      assessment={assessment}
      services={services}
      relatedReadings={relatedReadings}
      passwordRequired={false}
      passwordEntries={[]}
      authorAvatarUrl={settings.about_hero_image}
      action="/api/admin/case-studies"
    />
  </>;
}
