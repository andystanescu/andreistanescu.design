import { db } from "@/lib/db";

export type SettingsMap = {
  author_name: string;
  logo_identity: "business" | "personal";
  work_outcome_title: string;
  work_outcome_body: string;
  approach_principle_eyebrow: string;
  approach_principle_title: string;
  approach_principle_body: string;
  approach_how_eyebrow: string;
  approach_how_title: string;
  approach_leave_eyebrow: string;
  approach_leave_one_title: string;
  approach_leave_one_body: string;
  approach_leave_two_title: string;
  approach_leave_two_body: string;
  approach_leave_three_title: string;
  approach_leave_three_body: string;
  approach_shared_title: string;
  approach_shared_body: string;
  approach_audience_leadership_title: string;
  approach_audience_leadership_body: string;
  approach_audience_product_title: string;
  approach_audience_product_body: string;
  approach_audience_org_title: string;
  approach_audience_org_body: string;
  confirmation_title: string;
  confirmation_body: string;
  contact_email_to: string;
  logo_image: string;
  logo_image_footer: string;
  about_hero_image: string;
  about_cv: string;
  homepage_cta_band_label: string;
  homepage_case_study_link_label: string;
  homepage_article_link_label: string;
  homepage_insights_all_label: string;
  homepage_meta_title: string;
  homepage_meta_description: string;
  homepage_meta_title_business: string;
  homepage_meta_description_business: string;
  homepage_meta_title_personal: string;
  homepage_meta_description_personal: string;
  homepage_meta_keywords: string;
  homepage_canonical_url: string;
  homepage_og_image: string;
  homepage_no_index: string;
};

const KEYS: (keyof SettingsMap)[] = [
  "author_name",
  "logo_identity",
  "work_outcome_title",
  "work_outcome_body",
  "approach_principle_eyebrow",
  "approach_principle_title",
  "approach_principle_body",
  "approach_how_eyebrow",
  "approach_how_title",
  "approach_leave_eyebrow",
  "approach_leave_one_title",
  "approach_leave_one_body",
  "approach_leave_two_title",
  "approach_leave_two_body",
  "approach_leave_three_title",
  "approach_leave_three_body",
  "approach_shared_title",
  "approach_shared_body",
  "approach_audience_leadership_title",
  "approach_audience_leadership_body",
  "approach_audience_product_title",
  "approach_audience_product_body",
  "approach_audience_org_title",
  "approach_audience_org_body",
  "confirmation_title",
  "confirmation_body",
  "contact_email_to",
  "logo_image",
  "logo_image_footer",
  "about_hero_image",
  "about_cv",
  "homepage_cta_band_label",
  "homepage_case_study_link_label",
  "homepage_article_link_label",
  "homepage_insights_all_label",
  "homepage_meta_title",
  "homepage_meta_description",
  "homepage_meta_title_business",
  "homepage_meta_description_business",
  "homepage_meta_title_personal",
  "homepage_meta_description_personal",
  "homepage_meta_keywords",
  "homepage_canonical_url",
  "homepage_og_image",
  "homepage_no_index",
];

export function getSettings(): SettingsMap {
  const rows = db.prepare("SELECT key, value FROM settings").all() as {
    key: string;
    value: string;
  }[];
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const logoIdentity = map.logo_identity === "personal" ? "personal" : "business";
  const businessMetaTitle = map.homepage_meta_title_business || map.homepage_meta_title || "ConScept — Design systems, product architecture, AI-enabled design operations";
  const businessMetaDescription = map.homepage_meta_description_business || map.homepage_meta_description || "ConScept helps growing technology companies build the systems behind their products: design system architecture, product architecture, and AI-enabled design operations.";
  const personalMetaTitle = map.homepage_meta_title_personal || "Andrei Stanescu — Product, design and systems thinking";
  const personalMetaDescription = map.homepage_meta_description_personal || "Andrei Stanescu helps teams make better product decisions through design systems, product architecture and thoughtful ways of working.";
  return {
    author_name: map.author_name ?? "Andrei Stanescu",
    logo_identity: logoIdentity,
    work_outcome_title: map.work_outcome_title ?? "Better systems make better work repeatable.",
    work_outcome_body: map.work_outcome_body ?? "Clarity compounds: decisions become easier, teams move with more confidence and products improve over time.",
    approach_principle_eyebrow: map.approach_principle_eyebrow ?? "THE PRINCIPLE",
    approach_principle_title: map.approach_principle_title ?? "Solve the system, not just the symptom.",
    approach_principle_body: map.approach_principle_body ?? "My work is designed to leave teams with stronger reasoning, clearer ownership and systems that can evolve.",
    approach_how_eyebrow: map.approach_how_eyebrow ?? "HOW I WORK",
    approach_how_title: map.approach_how_title ?? "A practical path from ambiguity to momentum.",
    approach_leave_eyebrow: map.approach_leave_eyebrow ?? "WHAT I LEAVE BEHIND",
    approach_leave_one_title: map.approach_leave_one_title ?? "Start with causes",
    approach_leave_one_body: map.approach_leave_one_body ?? "Understand the relationships behind the visible problem.",
    approach_leave_two_title: map.approach_leave_two_title ?? "Make thinking visible",
    approach_leave_two_body: map.approach_leave_two_body ?? "Turn tacit knowledge into shared principles and decisions.",
    approach_leave_three_title: map.approach_leave_three_title ?? "Build independence",
    approach_leave_three_body: map.approach_leave_three_body ?? "Leave teams stronger and more capable than I found them.",
    approach_shared_title: map.approach_shared_title ?? "A shared way of working",
    approach_shared_body: map.approach_shared_body ?? "The best outcomes happen when the work becomes part of the team—not a handoff at the end.",
    approach_audience_leadership_title: map.approach_audience_leadership_title ?? "For leadership",
    approach_audience_leadership_body: map.approach_audience_leadership_body ?? "Clearer priorities, better trade-offs and a foundation that supports growth.",
    approach_audience_product_title: map.approach_audience_product_title ?? "For product teams",
    approach_audience_product_body: map.approach_audience_product_body ?? "A practical system that connects decisions across design, engineering and product.",
    approach_audience_org_title: map.approach_audience_org_title ?? "For the organisation",
    approach_audience_org_body: map.approach_audience_org_body ?? "Knowledge and principles that compound beyond a single project.",
    confirmation_title: map.confirmation_title ?? "",
    confirmation_body: map.confirmation_body ?? "",
    contact_email_to: map.contact_email_to ?? "",
    logo_image: map.logo_image ?? "",
    // Falls back to the header logo so existing single-logo setups don't
    // lose their footer logo the moment this field exists but is unset.
    logo_image_footer: map.logo_image_footer || map.logo_image || "",
    about_hero_image: map.about_hero_image ?? "",
    about_cv: map.about_cv ?? "",
    homepage_cta_band_label: map.homepage_cta_band_label ?? "Start a conversation",
    homepage_case_study_link_label: map.homepage_case_study_link_label ?? "View case study",
    homepage_article_link_label: map.homepage_article_link_label ?? "Read article",
    homepage_insights_all_label: map.homepage_insights_all_label ?? "See all insights",
    homepage_meta_title: logoIdentity === "personal" ? personalMetaTitle : businessMetaTitle,
    homepage_meta_description: logoIdentity === "personal" ? personalMetaDescription : businessMetaDescription,
    homepage_meta_title_business: businessMetaTitle,
    homepage_meta_description_business: businessMetaDescription,
    homepage_meta_title_personal: personalMetaTitle,
    homepage_meta_description_personal: personalMetaDescription,
    homepage_meta_keywords: map.homepage_meta_keywords ?? "",
    homepage_canonical_url: map.homepage_canonical_url ?? "",
    homepage_og_image: map.homepage_og_image ?? "",
    homepage_no_index: map.homepage_no_index ?? "0",
  };
}

export function updateSettings(update: Partial<SettingsMap>) {
  const stmt = db.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  );
  for (const key of KEYS) {
    if (update[key] !== undefined) {
      stmt.run(key, update[key]);
    }
  }
}
