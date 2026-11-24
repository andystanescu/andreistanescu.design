export const TRANSFER_GROUPS = [
  { key: "testimonials", label: "Testimonials", description: "Testimonial quotes, attribution, source, publication status and order.", images: false },
  { key: "caseStudies", label: "Case studies", description: "Published and draft projects, assessments, metadata and category assignments.", images: true },
  { key: "categories", label: "Categories", description: "Category names, descriptions, order and case-study assignments.", images: false },
  { key: "insights", label: "Articles", description: "Published, scheduled and draft articles, including tags and metadata.", images: true },
  { key: "pages", label: "Pages and experience", description: "Page content, homepage and About sections, experience and page metadata.", images: true },
  { key: "siteIdentity", label: "Site identity", description: "Author name, logos, colour palettes, logo colour mappings and light and dark theme selections.", images: true },
  { key: "navigation", label: "Navigation and footer", description: "Navigation style, page menu order and visibility, and footer settings.", images: false },
  { key: "services", label: "Services", description: "Service extensions, dedicated pages and their content and layouts.", images: true },
  { key: "siteSettings", label: "Other site settings", description: "Site name, contact details and other general settings.", images: true },
  { key: "analyticsEvents", label: "Traffic events", description: "Stored views, shares and downloads used in traffic reports.", images: false },
] as const;

export type TransferKey = (typeof TRANSFER_GROUPS)[number]["key"];

export function settingTransferGroup(key: string): TransferKey {
  if (key === "author_name" || key.startsWith("logo_") || key.startsWith("theme_")) return "siteIdentity";
  if (key === "navigation_style" || key.startsWith("footer_")) return "navigation";
  if (key.startsWith("about_") || key.startsWith("homepage_") || key.startsWith("approach_") || key.startsWith("work_outcome_")) return "pages";
  return "siteSettings";
}

/** Group related records together while preserving the version 1 transfer format. */
export function transferGroupSource(payload: Record<string, unknown>, key: TransferKey): unknown {
  return payload[key];
}

export function uploadFilenames(value: unknown): Set<string> {
  const names = new Set<string>();
  const visit = (item: unknown): void => {
    if (typeof item === "string") {
      const source = item.replace(/%2Fuploads%2F/gi, "/uploads/");
      for (const match of source.matchAll(/\/uploads\/([^"'?#%/\\]+)/g)) names.add(match[1]);
    } else if (Array.isArray(item)) item.forEach(visit);
    else if (item && typeof item === "object") Object.values(item).forEach(visit);
  };
  visit(value);
  return names;
}

export function parseTransferSelection(value: string | null): Set<TransferKey> {
  const allowed = new Set<string>(TRANSFER_GROUPS.map(({ key }) => key));
  return new Set((value ?? "").split(",").filter((key): key is TransferKey => allowed.has(key)));
}
