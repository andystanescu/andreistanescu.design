export const DESIGN_SYSTEM_GROUPS = [
  { label: "Foundations", links: [["Colour", "colours"], ["Typography", "typography"], ["Spacing & layout", "spacing"]] },
  { label: "Site components", links: [["Buttons", "buttons"], ["Content cards", "cards"], ["Feedback & empty states", "feedback"], ["Process & disclosure", "patterns"], ["Page composition", "layouts"]] },
  { label: "Admin components", links: [["Form controls", "forms"], ["Filters & tabs", "filters"], ["CV upload", "upload"], ["Image upload", "image-upload"], ["Metadata fields", "metadata"], ["Rich text editor", "rich-text"], ["Reorderable list", "reorder"], ["Admin editors", "admin-editors"], ["Icons", "icons"]] },
] as const;

const adminCss = "src/app/admin/(dashboard)/admin.module.css";
const component = (path: string) => [`src/components/${path}/${path.split("/").at(-1)}.tsx`, `src/components/${path}/${path.split("/").at(-1)}.module.css`];
export const DESIGN_SYSTEM_FILES: Record<string, string[]> = {
  colours: ["src/app/globals.css", "src/lib/themePalette.ts", ...component("ThemeSwitch")],
  typography: ["src/app/globals.css"], spacing: ["src/app/globals.css"],
  buttons: [...component("Button"), "src/components/Icon/ArrowIcon.tsx"],
  forms: [adminCss, "src/components/admin/TagSuggestions/TagSuggestions.tsx", "src/components/admin/CaseStudyEditor/CaseStudyEditor.module.css"],
  filters: ["src/components/admin/ServiceTemplatePicker/ServiceTemplatePicker.tsx", "src/components/insights/InsightsListing/InsightsListing.module.css", "src/components/admin/NavigationPreview/NavigationPreview.module.css", ...component("admin/AdminContentTabs")],
  cards: [...component("ArticleCard"), "src/components/Icon/ArrowIcon.tsx"], upload: [...component("admin/CvUpload"), ...component("admin/AdminIcon"), "public/assets/lattice/icon-cv.svg"],
  "image-upload": component("admin/ImageField"), metadata: ["src/components/admin/MetadataFields/MetadataFields.tsx", adminCss],
  "rich-text": [...component("admin/RichTextEditor"), "src/components/admin/RichTextEditor/AccentMark.ts"],
  reorder: component("admin/ReorderableList"), icons: component("admin/AdminIcon"),
  "admin-editors": [
    ...component("admin/CaseStudyEditor"), "src/components/admin/InsightEditor/InsightEditor.tsx", "src/components/admin/CategoryServiceEditor/CategoryServiceEditor.tsx",
    ...component("admin/InlineSectionCard"), "src/components/admin/InlineSectionCard/SectionLivePreview.tsx", ...component("admin/NavigationPreview"), ...component("admin/FooterEditor"), ...component("admin/SiteIdentityEditor"), "src/components/admin/SiteIdentityEditor/LogoColorEditor.tsx",
    "src/components/admin/AboutAdminHeader/AboutAdminHeader.tsx", ...component("admin/AdminNav"), "src/components/admin/AdminSidebar/AdminSidebar.tsx", ...component("admin/AdminTabs"),
    "src/components/admin/CategoryDeleteActions/CategoryDeleteActions.tsx", ...component("admin/ContentStatusFilter"), "src/components/admin/DashboardGreeting/DashboardGreeting.tsx", "src/components/admin/ExperienceForm/ExperienceForm.tsx",
    ...component("admin/LayoutEditor"), "src/components/admin/LayoutEditor/PreviewCanvas.tsx", "src/components/admin/PageSettingsForm/PageSettingsForm.tsx", "src/components/admin/ServiceToggle/ServiceToggle.tsx", "src/components/admin/SubmissionActions/SubmissionActions.tsx", "src/components/admin/ViewSiteLink/ViewSiteLink.tsx",
  ],
  feedback: [...component("Callout"), ...component("EmptyState")],
  patterns: [...component("ProcessStepper"), ...component("admin/InlineSectionCard"), "src/components/admin/InlineSectionCard/SectionLivePreview.tsx"],
  layouts: component("services/ServiceSection"),
};

export function isDesignSystemSection(id: string): boolean {
  return Object.hasOwn(DESIGN_SYSTEM_FILES, id);
}
