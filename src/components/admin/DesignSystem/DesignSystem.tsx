"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/Button/Button";
import { ArrowIcon } from "@/components/Icon/ArrowIcon";
import { Callout } from "@/components/Callout/Callout";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { ProcessStepper } from "@/components/ProcessStepper/ProcessStepper";
import { CvUpload } from "@/components/admin/CvUpload/CvUpload";
import { AdminIcon } from "@/components/admin/AdminIcon/AdminIcon";
import { ThemeSwitch } from "@/components/ThemeSwitch/ThemeSwitch";
import { ServiceTemplatePicker } from "@/components/admin/ServiceTemplatePicker/ServiceTemplatePicker";
import { ArticleCard } from "@/components/ArticleCard/ArticleCard";
import { TagSuggestions } from "@/components/admin/TagSuggestions/TagSuggestions";
import { AdminContentTabs } from "@/components/admin/AdminContentTabs/AdminContentTabs";
import { ImageField } from "@/components/admin/ImageField/ImageField";
import { MetadataFields } from "@/components/admin/MetadataFields/MetadataFields";
import { RichTextEditor } from "@/components/admin/RichTextEditor/RichTextEditor";
import { ReorderableList } from "@/components/admin/ReorderableList/ReorderableList";
import { ServiceSectionHeader } from "@/components/services/ServiceSection/ServiceSection";
import { ProjectCard } from "@/components/work/ProjectCard/ProjectCard";
import { ArticlePreview } from "@/components/insights/ArticlePreview/ArticlePreview";
import { ServiceIndexItem } from "@/components/services/ServiceIndexItem/ServiceIndexItem";
import { ImageGallery } from "@/components/ImageGallery/ImageGallery";
import { BeforeAfterComparison } from "@/components/BeforeAfterComparison/BeforeAfterComparison";
import { ImpactMetrics } from "@/components/ImpactMetrics/ImpactMetrics";
import { PageLoading } from "@/components/PageLoading/PageLoading";
import { Logo } from "@/components/Logo/Logo";
import { LogoIcon } from "@/components/Logo/LogoIcon";
import { PersonalLogoMark } from "@/components/Logo/PersonalLogoMark";
import { CodeBlockContent } from "@/components/CodeBlock/CodeBlockContent";
import { EngagementOverview } from "@/components/admin/EngagementOverview/EngagementOverview";
import { ContentPerformance } from "@/components/admin/ContentPerformance/ContentPerformance";
import { VisitorJourneys } from "@/components/admin/VisitorJourneys/VisitorJourneys";
import { LatticeBenefitIcon } from "@/components/services/LatticeBenefitIcon/LatticeBenefitIcon";
import { NavigationPreview } from "@/components/admin/NavigationPreview/NavigationPreview";
import { ContactForm } from "@/components/ContactForm/ContactForm";
import type { PerformanceItem } from "@/lib/contentPerformance";
import { DESIGN_SYSTEM_GROUPS } from "@/lib/designSystemManifest";
import admin from "@/app/admin/(dashboard)/admin.module.css";
import styles from "./DesignSystem.module.css";
import sectionCardStyles from "@/components/admin/InlineSectionCard/InlineSectionCard.module.css";

type Palette = Record<number, string>;
const tones = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
type Source = { path: string; code: string; unavailable?: boolean };
const LibraryContext = createContext<{ section?: string; sources: Source[] }>({ sources: [] });
const snippets: Record<string, string> = {
  "Action hierarchy": `import { Button } from "@/components/Button/Button";\n\n<Button variant="primary" onClick={handleAction}>Continue</Button>\n<Button variant="secondary">Cancel</Button>`,
  "Compact actions": `import { Button } from "@/components/Button/Button";\n\n<Button size="compact">Continue</Button>`,
  "Inputs and switches": `import styles from "@/app/admin/(dashboard)/admin.module.css";\n\n<label className={styles.field}>\n  <span className="label-small">Title</span>\n  <input className={styles.input} name="title" />\n</label>\n<label className={styles.checkboxField}>\n  <input type="checkbox" name="visible" />\n  <span className={styles.switch} aria-hidden="true" />\n  <span>Visible on site</span>\n</label>`,
  "Tag suggestions": `import { TagSuggestions } from "@/components/admin/TagSuggestions/TagSuggestions";\n\n<TagSuggestions draft={draft} existingTags={existingTags} selectedTags={selectedTags} onSelect={addTag} />`,
  "Selection pills": `import { ServiceTemplatePicker } from "@/components/admin/ServiceTemplatePicker/ServiceTemplatePicker";\n\n<ServiceTemplatePicker initial="all" templates={[["all", "All"], ["systems", "Design systems"]]} />`,
  "Content tabs": `import { AdminContentTabs } from "@/components/admin/AdminContentTabs/AdminContentTabs";\n\n<AdminContentTabs tabs={[\n  { id: "published", label: "Published", content: <p>Published content</p> },\n  { id: "drafts", label: "Drafts", content: <p>Draft content</p> },\n]} />`,
  "Article and case-study variants": `import { ArticleCard } from "@/components/ArticleCard/ArticleCard";\n\n<ArticleCard slug="article-slug" title="Article title" excerpt="A short introduction." />\n<ArticleCard variant="caseStudy" slug="project-slug" title="Project title" excerpt="A short introduction." />`,
  "CV upload": `import { CvUpload } from "@/components/admin/CvUpload/CvUpload";\n\n<CvUpload currentUrl={cvUrl} currentName={cvName} currentSize={cvSize} />`,
  "Image upload": `import { ImageField } from "@/components/admin/ImageField/ImageField";\n\n<ImageField name="cover_image" currentUrl={coverUrl} />`,
  "Metadata fields": `import { MetadataFields } from "@/components/admin/MetadataFields/MetadataFields";\n\n<MetadataFields values={page} />`,
  "Rich text editor": `import { RichTextEditor } from "@/components/admin/RichTextEditor/RichTextEditor";\n\n<RichTextEditor name="body" defaultValue={content} />`,
  "Reorderable list": `import { ReorderableList } from "@/components/admin/ReorderableList/ReorderableList";\n\n<ReorderableList items={items} reorderUrl="/api/admin/example/reorder" />`,
  "Callouts": `import { Callout } from "@/components/Callout/Callout";\n\n<Callout variant="decision">The team agreed on a direction.</Callout>`,
  "Empty state": `import { EmptyState } from "@/components/EmptyState/EmptyState";\n\n<EmptyState title="Nothing here yet." description="Try another filter." />`,
  "Process stepper": `import { ProcessStepper } from "@/components/ProcessStepper/ProcessStepper";\n\n<ProcessStepper steps={[{ id: 1, title: "Understand", description: "Bring context into view." }]} />`,
  "Disclosure": `import { InlineSectionCard } from "@/components/admin/InlineSectionCard/InlineSectionCard";\n\n<InlineSectionCard section={section} label="Section title" parent="about" preview={preview} />`,
  "Section anatomy": `import { ServiceSection, ServiceSectionHeader } from "@/components/services/ServiceSection/ServiceSection";\n\n<ServiceSection>\n  <ServiceSectionHeader eyebrow="APPROACH" title="A clear, useful heading." description="Supporting context." />\n</ServiceSection>`,
  "Semantic colours": `/* Use the shared semantic tokens from globals.css. */\ncolor: var(--text-primary);\nbackground: var(--bg-surface);\nborder-color: var(--border-default);`,
  "Project and article previews": `import { ProjectCard } from "@/components/work/ProjectCard/ProjectCard";\nimport { ArticlePreview } from "@/components/insights/ArticlePreview/ArticlePreview";\n\n<ProjectCard slug="project" index={1} title="Project title" description="Project description" />\n<ArticlePreview slug="article" title="Article title" excerpt="Introduction" minutes={5} />`,
  "Service index item": `import { ServiceIndexItem } from "@/components/services/ServiceIndexItem/ServiceIndexItem";\n\n<ul><ServiceIndexItem slug="design" title="Design" description="Service description" capabilities={[]} index={1} /></ul>`,
  "Gallery and lightbox": `import { ImageGallery } from "@/components/ImageGallery/ImageGallery";\n\n<ImageGallery images={[{ src: "/image.png", alt: "Description", caption: "Caption" }]} />`,
  "Before and after": `import { BeforeAfterComparison } from "@/components/BeforeAfterComparison/BeforeAfterComparison";\n\n<BeforeAfterComparison before={{ src: "/before.png", alt: "Before" }} after={{ src: "/after.png", alt: "After" }} />`,
  "Impact metrics": `import { ImpactMetrics } from "@/components/ImpactMetrics/ImpactMetrics";\n\n<ImpactMetrics metrics={[{ value: "42%", label: "Less time" }]} label="Project outcomes" />`,
  "Theme switch": `import { ThemeSwitch } from "@/components/ThemeSwitch/ThemeSwitch";\n\n<ThemeSwitch />`,
  "Engagement overview": `import { EngagementOverview } from "@/components/admin/EngagementOverview/EngagementOverview";\n\n<EngagementOverview data={overview} range="30d" />`,
  "Content performance": `import { ContentPerformance } from "@/components/admin/ContentPerformance/ContentPerformance";\n\n<ContentPerformance data={performance} range="30d" titles={titles} editLinks={editLinks} journeyPage={1} />`,
  "Visitor journeys": `import { VisitorJourneys } from "@/components/admin/VisitorJourneys/VisitorJourneys";\n\n<VisitorJourneys journeys={journeys} total={total} page={1} pageSize={12} range="30d" contentType={null} contentPage={1} titles={{}} />`,
  "Brand lockups": `import { Logo } from "@/components/Logo/Logo";\n\n<Logo variant="compact" identity={identity} imageUrl={logoUrl} />\n<Logo variant="primary" identity={identity} imageUrl={logoUrl} />`,
  "Navigation preview": `import { NavigationPreview } from "@/components/admin/NavigationPreview/NavigationPreview";\n\n<NavigationPreview items={items} logoIdentity={identity} logoImage={logoUrl} logoIconImage={iconUrl} initialStyle="default" previewOnly />`,
  "Service benefit marks": `import { LatticeBenefitIcon } from "@/components/services/LatticeBenefitIcon/LatticeBenefitIcon";\n\n<LatticeBenefitIcon index={0} />`,
  "Loading state": `import { PageLoading } from "@/components/PageLoading/PageLoading";\n\n<PageLoading kind="grid" />`,
  "Article hero": `import { ArticleHero } from "@/components/insights/ArticleHero/ArticleHero";\n\n<ArticleHero slug="example" title="Article title" excerpt="Introduction" author="Author" publishedAt="2025-01-01" dateLabel="1 Jan 2025" readingMinutes={5} />`,
  "Contact form": `import { ContactForm } from "@/components/ContactForm/ContactForm";\n\n<ContactForm />`,
  "Code block": `import { CodeBlockContent } from "@/components/CodeBlock/CodeBlockContent";\n\n<CodeBlockContent className={styles.content} html={'<pre><code>const example = true;</code></pre>'} />`,
};

function CodeBlock({ label, code }: { label: string; code: string }) {
  const [status, setStatus] = useState("");
  async function copy() {
    try { await navigator.clipboard.writeText(code); setStatus("Copied"); }
    catch { setStatus("Copy unavailable; select the code instead."); }
  }
  return <div className={styles.codeBlock}><div className={styles.codeHeader}><code>{label}</code><button type="button" onClick={copy}>Copy</button></div><pre><code>{code}</code></pre><span role="status" className={styles.copyStatus}>{status}</span></div>;
}

function Section({ id, eyebrow, title, description, children }: { id: string; eyebrow: string; title: string; description: string; children: ReactNode }) {
  const { section, sources } = useContext(LibraryContext);
  if (section !== id) return null;
  return <section id={id} className={styles.section} aria-labelledby={`${id}-title`}><header className={styles.sectionHeader}><p className="label-eyebrow">{eyebrow}</p><h2 id={`${id}-title`} className="heading-02">{title}</h2><p className="body-default">{description}</p></header>{children}<div className={styles.sources}><h3 className="heading-03">Component source</h3><p className="body-small">These are the project files used by the site. Change the files in the project and deploy them through Git to update every place that uses them. Source files depend on this project’s imports, assets and design tokens.</p>{sources.map(({ path, code, unavailable }) => <details key={path} className={styles.sourceDetails}><summary>{path}</summary>{unavailable ? <p className="body-small">This source file is unavailable in this deployment.</p> : <CodeBlock label={path} code={code} />}</details>)}</div></section>;
}
function Example({ title, rule, children }: { title: string; rule: string; children: ReactNode }) {
  return <article className={styles.example}><div className={styles.exampleHeader}><h3 className="heading-03">{title}</h3><p className="body-small">{rule}</p></div><div className={styles.canvas}>{children}</div>{snippets[title] && <details className={styles.sourceDetails}><summary>Usage code</summary><CodeBlock label="Example usage · TSX" code={snippets[title]} /></details>}</article>;
}

export function DesignSystem({ palettes, icons, iconSources, section, sources, identity, logoImage, logoIconImage, navigationStyle, articleHero }: { palettes: Record<"primary" | "secondary" | "accent" | "neutral", Palette>; icons: string[]; iconSources: Record<string, string>; section?: string; sources: Source[]; identity: "personal" | "business"; logoImage: string; logoIconImage: string; navigationStyle: "default" | "masthead" | "islands" | "menu-first" | "floating-rail"; articleHero?: ReactNode }) {
  const [notice, setNotice] = useState("");
  const [emptyAction, setEmptyAction] = useState(false);
  const [toggle, setToggle] = useState(false);
  const [tagDraft, setTagDraft] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [selectedIcon, setSelectedIcon] = useState("action-edit");
  function addTag(value: string) {
    const tag = value.trim();
    if (tag && !tags.some((item) => item.toLowerCase() === tag.toLowerCase())) setTags([...tags, tag]);
    setTagDraft("");
  }
  const [reorderStatus, setReorderStatus] = useState("");
  const examplePerformance: PerformanceItem = { group: "article", pageKey: "/insights/example", contentType: "article", contentId: "example", title: "Making decisions visible", sessions: 86, engaged: 52, deep: 24, medianAttention: 92, depth25: 80, depth50: 64, depth75: 48, depth90: 32, reachedEnd: 24, exposurePercent: 64, measuredSessions: 80, outcomeMeasured: 0, outcomesReached: 0, returns: 4, trackedSessions: 80, onward: 20, evidenceOpened: 0, relatedOpened: 9, contactClicks: 3, cvClicks: 0, submissionSessions: 1 };
  const exampleJourney = { source: "Direct", country: "GB", classification: "likely_human", measurementVersion: 2, engagement: "engaged", started: "2025-01-15 12:30:00", duration: 240, activeSeconds: 135, pageCount: 2, actionCount: 1, contacted: false, pages: [{ page_key: "/", title: "Homepage", content_type: "home", active_seconds: 35, max_depth: 80, chapter_count: 0, engagement_level: "explored", eligible: 4, attended: 3 }, { page_key: "/work/example", title: "Example case study", content_type: "case_study", active_seconds: 100, max_depth: 90, chapter_count: 3, engagement_level: "engaged", eligible: 5, attended: 4 }], actions: [{ page_key: "/work/example", detail: "chapter_navigation" }] };
  return <LibraryContext.Provider value={{ section, sources }}><div className={styles.library}>
    <header className={styles.hero}><div><p className="label-eyebrow">INTERNAL LIBRARY</p><h1 className="heading-01">Design system</h1><p className="body-large">The foundations, components and patterns used by the website. Explore the real components and copy their source or usage code.</p></div><div className={styles.heroAside}><span className="label-small">Current site theme</span><ThemeSwitch /><span className="body-small">Switches the site appearance.</span></div></header>
    {!section && <div className={styles.overview}>{DESIGN_SYSTEM_GROUPS.map((group) => <section key={group.label}><h2 className="heading-02">{group.label}</h2><div className={styles.overviewLinks}>{group.links.map(([label, id]) => <Link key={id} href={`/admin/design-system/${id}`}>{label} <span aria-hidden="true">→</span></Link>)}</div></section>)}</div>}

    <Section id="colours" eyebrow="FOUNDATIONS / 01" title="Colour" description="Palettes come from the published Site Identity settings. Interface surfaces and actions use semantic tokens that adapt to the active theme.">
      <div className={styles.paletteList}>{Object.entries(palettes).map(([name, palette]) => <div className={styles.palette} key={name}><div><h3 className="heading-03">{name}</h3><p className="body-small">500 · {palette[500]}</p></div><div className={styles.tones}>{tones.map((tone) => <div className={styles.tone} key={tone}><span style={{ backgroundColor: palette[tone] }} /><strong>{tone}</strong><code>{palette[tone]}</code></div>)}</div></div>)}</div>
      <Example title="Semantic colours" rule="Use semantic tokens for surfaces and text so the interface stays legible when the theme changes."><div className={styles.swatches}>{[["Canvas", "--bg-canvas", "--text-primary"], ["Surface", "--bg-surface", "--text-primary"], ["Subtle", "--bg-subtle", "--text-primary"], ["Accent text", "--bg-canvas", "--text-accent"]].map(([label, background, color]) => <div className={styles.swatch} style={{ background: `var(${background})`, color: `var(${color})` }} key={label}><strong>{label}</strong><code>{color === "--text-accent" ? color : background}</code></div>)}</div></Example>
      <Example title="Status colours" rule="Status backgrounds and text use semantic tokens. Switch the site theme above to inspect their other appearance."><div className={styles.swatches}>{["error", "success", "warning", "info"].map((tone) => <div key={tone} className={styles.swatch} style={{ background: `var(--bg-${tone})`, color: `var(--text-${tone})` }}><strong>{tone}</strong><code>--bg-{tone} / --text-{tone}</code></div>)}</div></Example>
      <Example title="Interface colour roles" rule="These are the actual semantic variables used for text, borders and interactive actions. Values follow the selected site theme."><div className={styles.tokenList}>{["--text-primary", "--text-secondary", "--text-tertiary", "--text-accent", "--border-default", "--border-strong", "--border-field", "--border-focus", "--action-primary-bg", "--action-primary-hover", "--action-primary-pressed", "--action-secondary-bg", "--action-secondary-hover", "--action-secondary-pressed", "--action-link-text", "--action-link-hover"].map((token) => <div key={token}><span style={{ background: `var(${token})` }} /><code>{token}</code></div>)}</div></Example>
    </Section>

    <Section id="typography" eyebrow="FOUNDATIONS / 02" title="Typography" description="The site uses its shared type classes for hierarchy. Keep headings and supporting copy distinct, and choose size for the content rather than decoration.">
      <div className={styles.typeList}>{[["display-large", "Display large"], ["display-small", "Display small"], ["heading-01", "Heading 01"], ["heading-02", "Heading 02"], ["heading-03", "Heading 03"], ["body-large", "Body large — clear ideas make better decisions."], ["body-default", "Body default — the foundations of a connected product."], ["body-small", "Body small — supporting context and useful detail."], ["label-eyebrow", "EYEBROW LABEL"], ["mono-token", "MONO / 0123456789"]].map(([type, example]) => <div className={styles.typeRow} key={type}><code>{type}</code><p className={type}>{example}</p></div>)}</div>
      <Example title="Admin typography" rule="The admin uses its own denser styles alongside the shared body font. These controls use the actual admin classes."><div className={styles.formDemo}><label className={admin.field}><span className="label-small">Field label</span><input className={admin.input} defaultValue="Admin input text" /></label><button type="button" className={admin.secondaryButton}>Admin action</button></div></Example>
    </Section>

    <Section id="spacing" eyebrow="FOUNDATIONS / 03" title="Spacing & layout" description="Use the shared spacing scale to make relationships clear. Smaller gaps bind related content; larger gaps separate groups and sections.">
      <div className={styles.spacingList}>{[["50", 4], ["100", 8], ["150", 12], ["200", 16], ["300", 24], ["400", 32], ["600", 48], ["800", 64], ["1200", 96], ["1600", 128]].map(([token, size]) => <div className={styles.spacingRow} key={token}><code>space-{token}</code><span style={{ width: `var(--space-${token})` }} /><span>{size}px</span></div>)}</div>
      <Example title="Corner radii" rule="These are the radius tokens currently defined by the site."><div className={styles.actionRow}>{["sm", "md", "lg"].map((radius) => <div key={radius} className={styles.radiusSample} style={{ borderRadius: `var(--radius-${radius})` }}><code>radius-{radius}</code></div>)}</div></Example>
      <p className={styles.rule}>Public pages use full-width sections with a centred, capped inner area. On smaller screens the content stacks and gutters become narrower; the admin keeps its navigation in a drawer.</p>
    </Section>

    <Section id="elevation" eyebrow="FOUNDATIONS" title="Elevation & focus" description="Use the existing focus and error tokens to make keyboard focus and invalid fields visible. Existing components also define local shadows for their own elevation.">
      <Example title="Focus and error" rule="Tab to the control to see the real focus ring; the second field shows the existing error token."><div className={styles.formDemo}><label className={admin.field}><span className="label-small">Focus example</span><input className={admin.input} placeholder="Use Tab to focus" /></label><label className={admin.field}><span className="label-small">Error example</span><input className={admin.input} aria-invalid="true" defaultValue="Invalid value" style={{ borderColor: "var(--border-error)" }} /><span style={{ color: "var(--text-error)" }}>Enter a valid value.</span></label></div></Example>
    </Section>

    <Section id="brand" eyebrow="FOUNDATIONS" title="Brand marks" description="The site uses the published identity and uploaded logo, with compact and primary lockups for different contexts.">
      <Example title="Brand lockups" rule="These use the same Logo component and identity settings as the site. Theme switching applies to uploaded SVG mappings."><div className={styles.brandSamples}><Logo identity={identity} imageUrl={logoImage} variant="compact" /><Logo identity={identity} imageUrl={logoImage} variant="primary" />{logoIconImage && <div><LogoIcon identity={identity} imageUrl={logoIconImage} /><span className="body-small">Uploaded icon and favicon</span></div>}<div><PersonalLogoMark size={48} /><span className="body-small">Personal mark</span></div></div></Example>
    </Section>

    <Section id="navigation" eyebrow="SITE COMPONENTS" title="Navigation" description="The site navigation, footer, admin sidebar and mobile drawer are composed from the project files below. Their live configuration is managed in Navigation.">
      <Example title="Theme switch" rule="This is the live site switch. It changes the site theme, including this library."><ThemeSwitch /></Example>
      <Example title="Navigation preview" rule="Switch styles and devices or reorder the sample links. Changes in this library remain local and are never saved."><NavigationPreview previewOnly items={[{ id: "work", label: "Work" }, { id: "insights", label: "Articles" }, { id: "about", label: "About" }, { id: "services", label: "Services" }]} logoIdentity={identity} logoImage={logoImage} logoIconImage={logoIconImage} initialStyle={navigationStyle} /></Example>
      <p className={styles.rule}>The site has Default, Masthead, Islands, Menu-first and Floating rail layouts. The real navigation and footer are shown on the public site; the admin sidebar is visible alongside this library.</p>
    </Section>

    <Section id="buttons" eyebrow="COMPONENTS / 01" title="Buttons" description="Use the primary action for the main next step; secondary, tertiary, ghost and link treatments create a quieter hierarchy. Hover, focus and press the examples.">
      <Example title="Action hierarchy" rule="These examples use the shared Button component; the action below is a local demonstration."><div className={styles.actionRow}>{(["primary", "secondary", "tertiary", "ghost", "link"] as const).map((variant) => <Button key={variant} variant={variant} icon={variant === "link" ? undefined : <ArrowIcon />} onClick={() => setNotice(`${variant[0].toUpperCase()}${variant.slice(1)} action activated.`)}>{variant[0].toUpperCase() + variant.slice(1)}</Button>)}</div><p className={styles.demoStatus} role="status">{notice || "Choose a button to see its response."}</p></Example>
      <Example title="Compact actions" rule="Use compact buttons where space is constrained and the relationship remains clear."><div className={styles.actionRow}><Button size="compact" onClick={() => setNotice("Compact action activated.")}>Compact primary</Button><Button variant="secondary" size="compact" onClick={() => setNotice("Compact secondary activated.")}>Compact secondary</Button></div></Example>
    </Section>

    <Section id="forms" eyebrow="COMPONENTS / 02" title="Form controls" description="Labels remain visible, supporting text explains the task, and focus states identify where keyboard input will go.">
      <Example title="Inputs and switches" rule="These are the same field and switch styles used in the admin. Try typing, selecting an option and switching the control."><div className={styles.formDemo}><label className={admin.field}><span className="label-small">Title</span><input className={admin.input} placeholder="Add a title" /></label><label className={admin.field}><span className="label-small">Description</span><textarea className={admin.textarea} placeholder="Add supporting context" rows={3} /></label><label className={admin.field}><span className="label-small">Status</span><select className={admin.input} defaultValue="draft"><option value="draft">Draft</option><option value="published">Published</option></select></label><label className={admin.checkboxField}><input type="checkbox" role="switch" checked={toggle} onChange={(event) => setToggle(event.target.checked)} /><span className={admin.switch} aria-hidden="true" /><span>{toggle ? "Visible on site" : "Hidden from site"}</span></label></div></Example>
      <Example title="Input states and choices" rule="Required and error text remain visible. Native checkbox and radio controls can be operated by keyboard."><div className={styles.formDemo}><label className={admin.field}><span className="label-small">Search <span aria-hidden="true">*</span></span><input className={admin.input} type="search" required placeholder="Search content" /><span className="body-small">Enter a title or keyword.</span></label><label className={admin.field}><span className="label-small">Filled</span><input className={admin.input} defaultValue="Example value" /></label><label className={admin.field}><span className="label-small">Disabled</span><input className={admin.input} disabled value="Unavailable" readOnly /></label><label><input type="checkbox" /> Include this option</label><fieldset><legend className="label-small">Choose one</legend><label><input type="radio" name="example-choice" defaultChecked /> First</label>{" "}<label><input type="radio" name="example-choice" /> Second</label></fieldset></div></Example>
      <Example title="Tag suggestions" rule="Suggestions appear after two characters, with up to five matches. Select one or press Enter to add a custom tag."><div className={styles.formDemo}><label className={admin.field}><span className="label-small">Tags</span><input className={admin.input} value={tagDraft} onChange={(event) => setTagDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTag(tagDraft); } }} placeholder="Try typing design" /></label><TagSuggestions draft={tagDraft} existingTags={["Design systems", "Design operations", "Product design", "Governance", "Research"]} selectedTags={tags} onSelect={addTag} /><div className={styles.tags}>{tags.map((tag) => <button type="button" key={tag} onClick={() => setTags(tags.filter((item) => item !== tag))} aria-label={`Remove ${tag}`}>{tag} ×</button>)}</div></div></Example>
    </Section>

    <Section id="filters" eyebrow="COMPONENTS / 03" title="Filters & tabs" description="Filters change the visible set; tabs group related views. The selected state stays visible and each option can be reached by keyboard.">
      <Example title="Selection pills" rule="The service template selector uses the same pills as the site's article filters."><ServiceTemplatePicker initial="all" templates={[["all", "All"], ["systems", "Design systems"], ["architecture", "Architecture"]]} /></Example>
      <Example title="Content tabs" rule="This is the same tab component used by the admin editors. Use arrow keys to move between tabs."><AdminContentTabs tabs={[{ id: "published", label: "Published", content: <p className="body-small">Showing the published view.</p> }, { id: "drafts", label: "Drafts", content: <p className="body-small">Showing the drafts view.</p> }]} /></Example>
    </Section>

    <Section id="cards" eyebrow="COMPONENTS / 04" title="Content cards" description="Cards represent real content objects. Examples use the components rendered on public pages."><Example title="Article and case-study variants" rule="Hover or focus the cards to see their states. These examples are illustrative and do not navigate."><div className={styles.cardGrid} onClickCapture={(event) => event.preventDefault()}><ArticleCard previewOnly slug="example" title="A clearer way to build together" excerpt="An example article about decisions, systems and the people who use them." category="DESIGN SYSTEMS" meta="8 MIN READ" showThumbnail={false} /><ArticleCard previewOnly slug="example" variant="caseStudy" title="From fragmented patterns to shared foundations" excerpt="An example of a project where common decisions changed how a product evolved." category="CASE STUDY" meta="2024" showThumbnail={false} /></div></Example><Example title="Project and article previews" rule="The Work and Articles listings use these featured and standard components."><div className={styles.cardGrid} onClickCapture={(event) => event.preventDefault()}><ProjectCard slug="example" title="A more coherent product" description="An example case study." index={1} /><ArticlePreview slug="example" title="Making decisions visible" excerpt="An example article." minutes={5} /></div></Example><Example title="Service index item" rule="The service index presents the title, description and capabilities as a single link."><ul onClickCapture={(event) => event.preventDefault()}><ServiceIndexItem slug="example" title="Product architecture" description="Clarify the structure behind a product." capabilities={["Boundaries", "Journeys"]} index={1} /></ul></Example></Section>

    <Section id="media" eyebrow="SITE COMPONENTS" title="Media & gallery" description="Use media containers for figures and interactive content. The gallery includes keyboard controls and a lightbox.">
      <Example title="Gallery and lightbox" rule="Choose a tile to open the real lightbox. Arrow keys change images and Escape closes it."><ImageGallery images={[{ src: "/assets/lattice-diagram.svg", alt: "Connected lattice", caption: "A connected lattice" }, { src: "/assets/mark-product-architecture.svg", alt: "Product architecture mark", caption: "A second example" }]} /></Example>
      <Example title="Before and after" rule="The comparison component presents two labelled images side by side."><BeforeAfterComparison before={{ src: "/assets/mark-design-systems.svg", alt: "Before example" }} after={{ src: "/assets/mark-product-architecture.svg", alt: "After example" }} /></Example>
      <Example title="Code block" rule="The content renderer uses this frame and copy control for code authored in the editor."><CodeBlockContent className={styles.exampleCode} html={'<pre><code>const example = true;</code></pre>'} /></Example>
    </Section>

    <Section id="dashboard" eyebrow="ADMIN COMPONENTS" title="Dashboard patterns" description="These are the same panels used by the admin dashboard, shown with illustrative data. Expand the content row to inspect its details.">
      <Example title="Engagement overview" rule="The metric cells, comparison pill and proportion bars come from the real overview component."><EngagementOverview range="30d" data={{ current: { sessions: 100, engaged: 64, deep: 28, pageViews: 220, enquiries: 4 }, previous: { sessions: 90, engaged: 55, deep: 25, pageViews: 190, enquiries: 3 }, trackingStart: "2025-01-01", comparisonAvailable: true }} /></Example>
      <Example title="Content performance" rule="Expand a row for the detail panel, comparison and additional signals. Values are sample data."><div onClickCapture={(event) => { if ((event.target as HTMLElement).closest("a")) event.preventDefault(); }}><ContentPerformance data={{ groups: [{ group: "article", itemCount: 1, sessions: 86, engaged: 52, medianAttention: 92, items: [examplePerformance] }], selectedGroup: null, page: 1, pageSize: 10, total: 1 }} range="30d" titles={{}} editLinks={{}} journeyPage={1} /></div></Example>
      <Example title="Visitor journeys" rule="Expand the sample journey to explore the timeline, interaction tags and classification disclosure. The values are illustrative."><VisitorJourneys journeys={[exampleJourney]} total={1} page={1} pageSize={12} range="30d" contentType={null} contentPage={1} titles={{}} /></Example>
    </Section>

    <Section id="upload" eyebrow="COMPONENTS / 05" title="File upload" description="The CV upload presents its empty and selected states in the About hero editor. The example below is local to this page and does not save a file."><Example title="CV upload" rule="PDF files are limited to 5 MB. The real editor applies replacement or removal when the section is saved."><CvUpload currentUrl="" currentName="" currentSize="" /></Example></Section>

    <Section id="image-upload" eyebrow="ADMIN COMPONENTS" title="Image upload" description="The image field used in content editors previews a chosen file before the surrounding form is saved."><Example title="Image upload" rule="Choose an image to see the local preview; this example does not submit a file."><ImageField name="example_image" /></Example></Section>

    <Section id="metadata" eyebrow="ADMIN COMPONENTS" title="Metadata fields" description="The metadata controls used by page and content editors group search and sharing information."><Example title="Metadata fields" rule="Try the fields and index switch. This example does not save changes."><MetadataFields /></Example></Section>

    <Section id="rich-text" eyebrow="ADMIN COMPONENTS" title="Rich text editor" description="The editor used for article and case-study content supports formatted text and embedded media."><Example title="Rich text editor" rule="Try the toolbar and formatting. This example holds content and images locally; it does not save them."><RichTextEditor name="example_body" defaultValue="<p>Select this text to explore the formatting controls.</p>" previewOnly /></Example></Section>

    <Section id="reorder" eyebrow="ADMIN COMPONENTS" title="Reorderable list" description="The same list component used in admin content screens supports drag reordering."><Example title="Reorderable list" rule="Drag a handle to move a row. This example keeps the order in the browser and does not save it."><ReorderableList className={admin.list} itemClassName={admin.listItem} handleOnly onReorder={(order) => setReorderStatus(`Order: ${order.join(", ")}`)} items={[{id:"First",node:<span>First item</span>},{id:"Second",node:<span>Second item</span>},{id:"Third",node:<span>Third item</span>}]} /><p className={styles.demoStatus} role="status">{reorderStatus || "Drag an item to change the order."}</p></Example></Section>

    <Section id="admin-editors" eyebrow="ADMIN COMPONENTS" title="Admin editors" description="The larger editors compose shared controls with content-specific data and save actions. Their project source is available below; use them in their corresponding admin routes rather than submitting example data here."><p className={styles.rule}>Includes the article and case-study editors, service editor, inline section editor, navigation and footer previews, and site identity editor.</p></Section>

    <Section id="icons" eyebrow="COMPONENTS / 06" title="Icons" description="The admin uses the Lattice icon set as monochrome masks, so icons follow the current text colour. Pair an icon with a clear accessible label. Select an icon for its usage code."><div className={styles.iconGrid}>{icons.map((name) => <button type="button" className={styles.iconItem} key={name} aria-pressed={selectedIcon === name} onClick={() => setSelectedIcon(name)}><AdminIcon name={name} /><code>{name}</code></button>)}</div><CodeBlock label={`Using ${selectedIcon} · TSX`} code={`import { AdminIcon } from "@/components/admin/AdminIcon/AdminIcon";\n\n<AdminIcon name=${JSON.stringify(selectedIcon)} />`} />{iconSources[selectedIcon] && <details className={styles.sourceDetails}><summary>SVG source for {selectedIcon}</summary><CodeBlock label={`public/assets/lattice/${selectedIcon}.svg`} code={iconSources[selectedIcon]} /></details>}<Example title="Service benefit marks" rule="The live service outcome component uses these four lattice patterns on a deep surface."><div className={styles.benefitIcons}>{[0, 1, 2, 3].map((index) => <LatticeBenefitIcon key={index} index={index} />)}</div></Example></Section>

    <Section id="feedback" eyebrow="PATTERNS / 01" title="Feedback & empty states" description="Explain what happened and offer a useful next step. Empty states belong in the page rather than appearing as unexplained gaps.">
      <Example title="Callouts" rule="Use a callout when a decision, outcome, constraint or note needs to stand out within content."><div className={styles.callouts}><Callout variant="note">A short piece of context for the reader.</Callout><Callout variant="decision">The team agreed on a shared direction.</Callout><Callout variant="outcome">The change made the next step clearer.</Callout><Callout variant="constraint">The work needed to fit an existing platform.</Callout></div></Example>
      <Example title="Empty state" rule="Say what is missing and offer a route forward where one exists."><EmptyState eyebrow={emptyAction ? "DEMONSTRATION" : "NO RESULTS"} title={emptyAction ? "Collection restored." : "Nothing here yet."} description={emptyAction ? "The example action returned to the collection." : "Try another filter or return to the full collection."} action={<Button variant="secondary" onClick={() => setEmptyAction(!emptyAction)}>{emptyAction ? "Reset example" : "View all"}</Button>} /></Example>
      <Example title="Loading state" rule="PageLoading supplies the site and admin skeleton layouts while a route is loading."><PageLoading kind="grid" /></Example>
    </Section>

    <Section id="patterns" eyebrow="PATTERNS / 02" title="Process & disclosure" description="Use process steps when sequence is meaningful. Use plus and minus icons to expand and collapse content; reserve chevrons for navigation to another section or page.">
      <Example title="Process stepper" rule="The shared stepper numbers and labels each stage in order, adapting its layout to the available space."><ProcessStepper steps={[{id:1,title:"Understand",description:"Bring the context into view."},{id:2,title:"Decide",description:"Choose where action is useful."},{id:3,title:"Learn",description:"Use evidence to guide the next step."}]} /></Example>
      <Example title="Disclosure" rule="The section editor uses a native disclosure and shared card styles. Expand it to reveal its content."><div className={sectionCardStyles.card}><details className={sectionCardStyles.details}><summary className={sectionCardStyles.summary}><strong className="body-default">Section title</strong><span className={sectionCardStyles.expandIcon} aria-hidden="true"><AdminIcon name="action-plus" className={sectionCardStyles.expandPlus} /><AdminIcon name="action-minus" className={sectionCardStyles.expandMinus} /></span></summary><p className={styles.disclosureContent}>Section controls and the live preview appear here.</p></details></div></Example>
    </Section>

    <Section id="layouts" eyebrow="PATTERNS / 03" title="Page composition" description="Combine sections, typography, dividers and relationships to reflect the content. Avoid treating every piece of information as a card."><Example title="Section anatomy" rule="This shared service section header introduces the subject with an eyebrow, a heading and supporting copy."><ServiceSectionHeader eyebrow="SECTION EYEBROW" title="A clear, useful heading." description="Supporting copy provides context before the next piece of content." /></Example><Example title="Article hero" rule="The article hero combines a category, headline, summary, byline and sharing control.">{articleHero}</Example><Example title="Impact metrics" rule="The same component is used for outcomes in case-study heroes and on the homepage."><ImpactMetrics metrics={[{ value: "42%", label: "Less time to complete" }, { value: "3×", label: "More coverage" }]} label="Example outcomes" /></Example><Example title="Contact form" rule="Explore the real form controls. Submission is disabled in this library example."><div onSubmitCapture={(event) => { event.preventDefault(); event.stopPropagation(); }}><ContactForm /></div></Example></Section>
  </div></LibraryContext.Provider>;
}
