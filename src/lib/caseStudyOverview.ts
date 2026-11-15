export type CaseStudyOverview = {
  eyebrow: string;
  title: string;
  situation: string;
  contribution: string;
  change: string;
  publicWhenProtected: boolean;
};

export function parseCaseStudyOverview(value: string | null | undefined): CaseStudyOverview {
  let data: Record<string, unknown> = {};
  try { const parsed: unknown = JSON.parse(value || "{}"); if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) data = parsed as Record<string, unknown>; } catch { /* Older or malformed content has no overview. */ }
  const text = (key: string) => typeof data[key] === "string" ? (data[key] as string).trim() : "";
  return { eyebrow: text("eyebrow") || "Overview", title: text("title"), situation: text("situation"), contribution: text("contribution"), change: text("change"), publicWhenProtected: data.publicWhenProtected === true };
}

export function overviewFromForm(form: FormData): string {
  return JSON.stringify({ eyebrow: String(form.get("overview_eyebrow") ?? "").trim() || "Overview", title: String(form.get("overview_title") ?? "").trim(), situation: String(form.get("overview_situation") ?? "").trim(), contribution: String(form.get("overview_contribution") ?? "").trim(), change: String(form.get("overview_change") ?? "").trim(), publicWhenProtected: form.get("overview_public") === "on" });
}

export function canShowCaseStudyOverview(overview: CaseStudyOverview, accessGranted: boolean): boolean {
  return (accessGranted || overview.publicWhenProtected) && Boolean(overview.title || overview.situation || overview.contribution || overview.change);
}
