import { relativeRedirect } from "@/lib/relativeRedirect";
import { NextRequest, NextResponse } from "next/server";
import { getPage, updatePage } from "@/lib/pages";
import { applyHeadingAccents } from "@/lib/headingAccents";
import { updateSettings } from "@/lib/settings";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!getPage(slug)) {
    return NextResponse.json({ error: "Unknown page." }, { status: 404 });
  }

  const form = await request.formData();
  const eyebrow = String(form.get("eyebrow") ?? "").trim();
  const title = String(form.get("title") ?? "").trim();
  const body = applyHeadingAccents(String(form.get("body") ?? "").trim());
  const showInNav = form.get("show_in_nav") === "on";
  const visible = slug === "home" ? true : form.get("visible") === "on";
  const navLabel = String(form.get("nav_label") ?? "").trim();
  const metaTitle = String(form.get("meta_title") ?? "").trim();
  const metaDescription = String(form.get("meta_description") ?? "").trim();
  const metaKeywords = String(form.get("meta_keywords") ?? "").trim();
  const canonicalUrl = String(form.get("canonical_url") ?? "").trim();
  const ogImage = String(form.get("og_image") ?? "").trim();
  const noIndex = form.get("no_index") === "on";
  // Pages with their own dedicated admin section (e.g. Services, About) embed
  // this same form as a "Page settings" tab there — this sends the redirect
  // back to that tab instead of the generic /admin/pages list.
  const redirectTo = String(form.get("redirect") ?? "").trim() || "/admin/pages";

  if (!title) {
    const url = new URL(`/admin/pages/${slug}`, request.url);
    url.searchParams.set("error", "Title is required.");
    return relativeRedirect(url.pathname + url.search);
  }

  updatePage(slug, { eyebrow, title, body, showInNav, navLabel, visible, metaTitle, metaDescription, metaKeywords, canonicalUrl, ogImage, noIndex });
  if (slug === "work") {
    updateSettings({
      work_outcome_title: String(form.get("work_outcome_title") ?? "").trim(),
      work_outcome_body: String(form.get("work_outcome_body") ?? "").trim(),
    });
  }
  if (slug === "approach") {
    updateSettings({
      approach_principle_eyebrow: String(form.get("approach_principle_eyebrow") ?? "").trim(),
      approach_principle_title: String(form.get("approach_principle_title") ?? "").trim(),
      approach_principle_body: String(form.get("approach_principle_body") ?? "").trim(),
      approach_how_eyebrow: String(form.get("approach_how_eyebrow") ?? "").trim(),
      approach_how_title: String(form.get("approach_how_title") ?? "").trim(),
      approach_leave_eyebrow: String(form.get("approach_leave_eyebrow") ?? "").trim(),
      approach_leave_one_title: String(form.get("approach_leave_one_title") ?? "").trim(),
      approach_leave_one_body: String(form.get("approach_leave_one_body") ?? "").trim(),
      approach_leave_two_title: String(form.get("approach_leave_two_title") ?? "").trim(),
      approach_leave_two_body: String(form.get("approach_leave_two_body") ?? "").trim(),
      approach_leave_three_title: String(form.get("approach_leave_three_title") ?? "").trim(),
      approach_leave_three_body: String(form.get("approach_leave_three_body") ?? "").trim(),
      approach_shared_title: String(form.get("approach_shared_title") ?? "").trim(),
      approach_shared_body: String(form.get("approach_shared_body") ?? "").trim(),
      approach_audience_leadership_title: String(form.get("approach_audience_leadership_title") ?? "").trim(),
      approach_audience_leadership_body: String(form.get("approach_audience_leadership_body") ?? "").trim(),
      approach_audience_product_title: String(form.get("approach_audience_product_title") ?? "").trim(),
      approach_audience_product_body: String(form.get("approach_audience_product_body") ?? "").trim(),
      approach_audience_org_title: String(form.get("approach_audience_org_title") ?? "").trim(),
      approach_audience_org_body: String(form.get("approach_audience_org_body") ?? "").trim(),
    });
  }

  return relativeRedirect(redirectTo);
}
