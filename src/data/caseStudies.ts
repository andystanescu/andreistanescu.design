import { db } from "@/lib/db";
import { parseCaseStudyAssessment } from "./caseStudyAssessment";
import type { CaseStudyAssessment } from "./caseStudyAssessment";
export type { CaseStudyAssessment } from "./caseStudyAssessment";

export type CaseStudy = {
  id: number;
  slug: string;
  eyebrow: string;
  category: string;
  year: string;
  title: string;
  description: string;
  tags: string;
  body: string;
  cover_image: string;
  thumbnail_image: string;
  position: number;
  published: number;
  outcome_eyebrow: string;
  outcome_title: string;
  metrics: string;
  assessment: string;
  password_required: number;
  password_hashes: string;
  author: string;
  published_at: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  canonical_url: string;
  og_image: string;
  no_index: number;
};

export type CaseStudyMetric = { value: string; label: string };

export function getCaseStudyAssessment(study: CaseStudy): CaseStudyAssessment {
  return parseCaseStudyAssessment(study.assessment);
}

export function getCaseStudyMetrics(study: CaseStudy): CaseStudyMetric[] {
  try {
    const metrics = JSON.parse(study.metrics || "[]");
    return Array.isArray(metrics) ? metrics.filter((m) => m?.value && m?.label).slice(0, 6) : [];
  } catch { return []; }
}

// Order = recency/curation via `position` — the first entry is the one
// featured on the homepage and at the top of /work. Managed entirely from
// /admin/case-studies; an empty result hides "Selected Impact" and shows an
// empty state on /work, rather than showing nothing broken.
export function getCaseStudies(): CaseStudy[] {
  return db
    .prepare(
      "SELECT * FROM case_studies WHERE published = 1 ORDER BY position ASC, id ASC"
    )
    .all() as CaseStudy[];
}

export function getCaseStudyBySlug(slug: string): CaseStudy | undefined {
  return db
    .prepare("SELECT * FROM case_studies WHERE slug = ? AND published = 1")
    .get(slug) as CaseStudy | undefined;
}
