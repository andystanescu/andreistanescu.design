export const DESIGN_SYSTEM_GROUPS = [
  { label: "Foundations", links: [["Colour", "colours"], ["Typography", "typography"], ["Spacing & layout", "spacing"], ["Elevation & focus", "elevation"], ["Icons", "icons"], ["Brand marks", "brand"]] },
  { label: "Site components", links: [["Buttons", "buttons"], ["Navigation", "navigation"], ["Content cards", "cards"], ["Media & gallery", "media"], ["Feedback & empty states", "feedback"], ["Process & disclosure", "patterns"], ["Page composition", "layouts"]] },
  { label: "Admin components", links: [["Form controls", "forms"], ["Filters & tabs", "filters"], ["Dashboard patterns", "dashboard"], ["CV upload", "upload"], ["Image upload", "image-upload"], ["Metadata fields", "metadata"], ["Rich text editor", "rich-text"], ["Reorderable list", "reorder"], ["Admin editors", "admin-editors"]] },
] as const;

const adminCss = "src/app/admin/(dashboard)/admin.module.css";
const component = (path: string) => [`src/components/${path}/${path.split("/").at(-1)}.tsx`, `src/components/${path}/${path.split("/").at(-1)}.module.css`];
export const DESIGN_SYSTEM_FILES: Record<string, string[]> = {
  colours: ["src/app/globals.css", "packages/core-domain/src/themePalette.ts", ...component("ThemeSwitch")],
  typography: ["src/app/globals.css", adminCss], spacing: ["src/app/globals.css"],
  elevation: ["src/app/globals.css", adminCss],
  brand: ["src/components/Logo/Logo.tsx", "src/components/Logo/Logo.module.css", "src/components/Logo/LogoIcon.tsx", "src/components/Logo/PersonalLogoMark.tsx", "src/components/Logo/ThemedLogoImage.tsx", "src/components/Logo/FaviconTheme.tsx", ...component("admin/SiteIdentityEditor"), "src/components/admin/SiteIdentityEditor/LogoColorEditor.tsx"],
  navigation: ["src/components/Nav/Nav.tsx", "src/components/Nav/NavClient.tsx", "src/components/Nav/Nav.module.css", ...component("ThemeSwitch"), ...component("BackButton"), ...component("admin/NavigationPreview"), "src/components/Footer/Footer.tsx", "src/components/Footer/Footer.module.css", "src/components/admin/AdminSidebar/AdminSidebar.tsx", "src/components/admin/AdminNav/AdminNav.tsx", "src/components/admin/AdminNav/AdminNav.module.css"],
  media: [...component("ImageGallery"), ...component("BeforeAfterComparison"), ...component("MediaFigure"), ...component("MediaContainer"), ...component("EmbedWrapper"), "src/components/CodeBlock/CodeBlockContent.tsx", "src/components/CodeBlock/CodeBlockContent.module.css"],
  dashboard: [...component("admin/EngagementOverview"), ...component("admin/ContentPerformance"), ...component("admin/VisitorJourneys"), "src/app/admin/(dashboard)/page.tsx", adminCss],
  buttons: [...component("Button"), "src/components/Icon/ArrowIcon.tsx"],
  forms: [adminCss, "src/components/admin/TagSuggestions/TagSuggestions.tsx", "src/components/admin/CaseStudyEditor/CaseStudyEditor.module.css"],
  filters: ["src/components/admin/ServiceTemplatePicker/ServiceTemplatePicker.tsx", "src/components/insights/InsightsListing/InsightsListing.module.css", "src/components/admin/NavigationPreview/NavigationPreview.module.css", ...component("admin/AdminContentTabs")],
  cards: [...component("ArticleCard"), ...component("work/ProjectCard"), ...component("insights/ArticlePreview"), ...component("services/ServiceIndexItem"), "src/components/Icon/ArrowIcon.tsx"], upload: [...component("admin/CvUpload"), ...component("admin/AdminIcon"), "public/assets/lattice/icon-cv.svg"],
  "image-upload": component("admin/ImageField"), metadata: ["src/components/admin/MetadataFields/MetadataFields.tsx", adminCss],
  "rich-text": [...component("admin/RichTextEditor"), "src/components/admin/RichTextEditor/AccentMark.ts"],
  reorder: component("admin/ReorderableList"), icons: [...component("admin/AdminIcon"), "src/components/services/LatticeBenefitIcon/LatticeBenefitIcon.tsx", "src/app/work/[slug]/page.tsx"],
  "admin-editors": [
    ...component("admin/CaseStudyEditor"), "src/components/admin/InsightEditor/InsightEditor.tsx", "src/components/admin/CategoryServiceEditor/CategoryServiceEditor.tsx",
    ...component("admin/InlineSectionCard"), "src/components/admin/InlineSectionCard/SectionLivePreview.tsx", ...component("admin/NavigationPreview"), ...component("admin/FooterEditor"), ...component("admin/SiteIdentityEditor"), "src/components/admin/SiteIdentityEditor/LogoColorEditor.tsx",
    "src/components/admin/AboutAdminHeader/AboutAdminHeader.tsx", ...component("admin/AdminNav"), "src/components/admin/AdminSidebar/AdminSidebar.tsx", ...component("admin/AdminTabs"),
    "src/components/admin/CategoryDeleteActions/CategoryDeleteActions.tsx", ...component("admin/ContentStatusFilter"), "src/components/admin/DashboardGreeting/DashboardGreeting.tsx", "src/components/admin/ExperienceForm/ExperienceForm.tsx",
    ...component("admin/LayoutEditor"), "src/components/admin/LayoutEditor/PreviewCanvas.tsx", "src/components/admin/PageSettingsForm/PageSettingsForm.tsx", "src/components/admin/ServiceToggle/ServiceToggle.tsx", "src/components/admin/SubmissionActions/SubmissionActions.tsx", "src/components/admin/ViewSiteLink/ViewSiteLink.tsx",
  ],
  feedback: [...component("Callout"), ...component("EmptyState"), ...component("PageLoading")],
  patterns: [...component("ProcessStepper"), ...component("admin/InlineSectionCard"), "src/components/admin/InlineSectionCard/SectionLivePreview.tsx"],
  layouts: [...component("services/ServiceSection"), ...component("insights/ArticleHero"), ...component("work/CaseStudyHero"), ...component("ImpactMetrics"), ...component("FourItemPrinciplesLayout"), ...component("ThreeItemFeatureLayout"), ...component("ContactForm"), ...component("home/CtaBand"), "src/app/services/[slug]/page.tsx", "src/app/services/[slug]/service-detail.module.css"],
};

export function isDesignSystemSection(id: string): boolean {
  return Object.hasOwn(DESIGN_SYSTEM_FILES, id);
}
