// Shared tab configs for admin sections split across multiple routes.
// Each dedicated section also owns a "Page settings" tab that absorbs the
// eyebrow/title/nav label/show-in-nav/body controls that used to live
// under the generic /admin/pages list (see /api/admin/pages/[slug]).

export const ABOUT_TABS = [
  { label: "Sections", href: "/admin/about" },
  { label: "Philosophy", href: "/admin/about-philosophy" },
  { label: "Highlights", href: "/admin/about-highlights" },
  { label: "Experience", href: "/admin/about-experiences" },
  { label: "Page settings", href: "/admin/about/settings" },
];

export const SERVICES_TABS = [
  { label: "Services", href: "/admin/services" },
  { label: "Page settings", href: "/admin/services/settings" },
];

export const APPROACH_TABS = [
  { label: "Approach steps", href: "/admin/approach-steps" },
  { label: "Page settings", href: "/admin/approach-steps/settings" },
];

export const CASE_STUDIES_TABS = [
  { label: "Case studies", href: "/admin/case-studies" },
  { label: "Page settings", href: "/admin/case-studies/settings" },
];

export const INSIGHTS_TABS = [
  { label: "Insights", href: "/admin/insights" },
  { label: "Page settings", href: "/admin/insights/settings" },
];
