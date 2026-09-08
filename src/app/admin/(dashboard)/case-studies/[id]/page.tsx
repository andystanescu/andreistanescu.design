import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import type { CaseStudy } from "@/data/caseStudies";
import { getCaseStudyMetrics } from "@/data/caseStudies";
import { CaseStudyEditor } from "@/components/admin/CaseStudyEditor/CaseStudyEditor";
import { getCaseStudyAssessment } from "@/data/caseStudies";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function EditCaseStudyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const study = db
    .prepare("SELECT * FROM case_studies WHERE id = ?")
    .get(id) as CaseStudy | undefined;

  if (!study) {
    notFound();
  }
  // Database drivers can return objects with a null prototype. Normalize the
  // values before passing them across the Server/Client Component boundary.
  const clientStudy = { ...study };
  const metrics = getCaseStudyMetrics(study).map((metric) => ({ ...metric }));
  const storedAssessment = getCaseStudyAssessment(study);
  const services = db
    .prepare("SELECT slug, title FROM service_items ORDER BY position ASC, id ASC")
    .all() as Array<{ slug: string; title: string }>;
  const assessment = {
    ...storedAssessment,
    scores: { ...storedAssessment.scores },
    primaryDrivers: [...storedAssessment.primaryDrivers],
    likelyEngagement: [...storedAssessment.likelyEngagement],
    conducted: [...storedAssessment.conducted],
  };
  let passwordEntries: Array<{ name: string; masked: string }> = [];
  try {
    const hashes = JSON.parse(study.password_hashes || "[]");
    passwordEntries = Array.isArray(hashes) ? hashes.map((entry, index) => ({ name: typeof entry === "object" && entry && "name" in entry && typeof entry.name === "string" ? entry.name : `Password ${index + 1}`, masked: "••••••••" })) : [];
  } catch { passwordEntries = []; }

  return (
    <>
      {error && <p style={{ color: "var(--border-error)" }}>{error}</p>}
      <CaseStudyEditor study={clientStudy} metrics={metrics} assessment={assessment} services={services.map((service) => ({ ...service }))} passwordRequired={Boolean(study.password_required)} passwordEntries={passwordEntries} authorAvatarUrl={getSettings().about_hero_image} />
    </>
  );
}
