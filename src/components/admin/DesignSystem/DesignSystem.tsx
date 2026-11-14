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

export function DesignSystem({ palettes, icons, iconSources, section, sources }: { palettes: Record<"primary" | "secondary" | "accent" | "neutral", Palette>; icons: string[]; iconSources: Record<string, string>; section?: string; sources: Source[] }) {
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
  return <LibraryContext.Provider value={{ section, sources }}><div className={styles.library}>
    <header className={styles.hero}><div><p className="label-eyebrow">INTERNAL LIBRARY</p><h1 className="heading-01">Design system</h1><p className="body-large">The foundations, components and patterns used by the website. Explore the real components and copy their source or usage code.</p></div><div className={styles.heroAside}><span className="label-small">Current site theme</span><ThemeSwitch /><span className="body-small">Switches the site appearance.</span></div></header>
    {!section && <div className={styles.overview}>{DESIGN_SYSTEM_GROUPS.map((group) => <section key={group.label}><h2 className="heading-02">{group.label}</h2><div className={styles.overviewLinks}>{group.links.map(([label, id]) => <Link key={id} href={`/admin/design-system/${id}`}>{label} <span aria-hidden="true">→</span></Link>)}</div></section>)}</div>}

    <Section id="colours" eyebrow="FOUNDATIONS / 01" title="Colour" description="Palettes come from the published Site Identity settings. Interface surfaces and actions use semantic tokens that adapt to the active theme.">
      <div className={styles.paletteList}>{Object.entries(palettes).map(([name, palette]) => <div className={styles.palette} key={name}><div><h3 className="heading-03">{name}</h3><p className="body-small">500 · {palette[500]}</p></div><div className={styles.tones}>{tones.map((tone) => <div className={styles.tone} key={tone}><span style={{ backgroundColor: palette[tone] }} /><strong>{tone}</strong><code>{palette[tone]}</code></div>)}</div></div>)}</div>
      <Example title="Semantic colours" rule="Use semantic tokens for surfaces and text so the interface stays legible when the theme changes."><div className={styles.swatches}>{[["Canvas", "--bg-canvas", "--text-primary"], ["Surface", "--bg-surface", "--text-primary"], ["Subtle", "--bg-subtle", "--text-primary"], ["Accent text", "--bg-canvas", "--text-accent"]].map(([label, background, color]) => <div className={styles.swatch} style={{ background: `var(${background})`, color: `var(${color})` }} key={label}><strong>{label}</strong><code>{color === "--text-accent" ? color : background}</code></div>)}</div></Example>
    </Section>

    <Section id="typography" eyebrow="FOUNDATIONS / 02" title="Typography" description="The site uses its shared type classes for hierarchy. Keep headings and supporting copy distinct, and choose size for the content rather than decoration.">
      <div className={styles.typeList}>{[["display-large", "Display large"], ["display-small", "Display small"], ["heading-01", "Heading 01"], ["heading-02", "Heading 02"], ["heading-03", "Heading 03"], ["body-large", "Body large — clear ideas make better decisions."], ["body-default", "Body default — the foundations of a connected product."], ["body-small", "Body small — supporting context and useful detail."], ["label-eyebrow", "EYEBROW LABEL"], ["mono-token", "MONO / 0123456789"]].map(([type, example]) => <div className={styles.typeRow} key={type}><code>{type}</code><p className={type}>{example}</p></div>)}</div>
    </Section>

    <Section id="spacing" eyebrow="FOUNDATIONS / 03" title="Spacing & layout" description="Use the shared spacing scale to make relationships clear. Smaller gaps bind related content; larger gaps separate groups and sections.">
      <div className={styles.spacingList}>{[["50", 4], ["100", 8], ["150", 12], ["200", 16], ["300", 24], ["400", 32], ["600", 48], ["800", 64], ["1200", 96], ["1600", 128]].map(([token, size]) => <div className={styles.spacingRow} key={token}><code>space-{token}</code><span style={{ width: `var(--space-${token})` }} /><span>{size}px</span></div>)}</div>
      <p className={styles.rule}>Public pages use full-width sections with a centred, capped inner area. On smaller screens the content stacks and gutters become narrower; the admin keeps its navigation in a drawer.</p>
    </Section>

    <Section id="buttons" eyebrow="COMPONENTS / 01" title="Buttons" description="Use the primary action for the main next step; secondary, tertiary, ghost and link treatments create a quieter hierarchy. Hover, focus and press the examples.">
      <Example title="Action hierarchy" rule="These examples use the shared Button component; the action below is a local demonstration."><div className={styles.actionRow}>{(["primary", "secondary", "tertiary", "ghost", "link"] as const).map((variant) => <Button key={variant} variant={variant} icon={variant === "link" ? undefined : <ArrowIcon />} onClick={() => setNotice(`${variant[0].toUpperCase()}${variant.slice(1)} action activated.`)}>{variant[0].toUpperCase() + variant.slice(1)}</Button>)}</div><p className={styles.demoStatus} role="status">{notice || "Choose a button to see its response."}</p></Example>
      <Example title="Compact actions" rule="Use compact buttons where space is constrained and the relationship remains clear."><div className={styles.actionRow}><Button size="compact" onClick={() => setNotice("Compact action activated.")}>Compact primary</Button><Button variant="secondary" size="compact" onClick={() => setNotice("Compact secondary activated.")}>Compact secondary</Button></div></Example>
    </Section>

    <Section id="forms" eyebrow="COMPONENTS / 02" title="Form controls" description="Labels remain visible, supporting text explains the task, and focus states identify where keyboard input will go.">
      <Example title="Inputs and switches" rule="These are the same field and switch styles used in the admin. Try typing, selecting an option and switching the control."><div className={styles.formDemo}><label className={admin.field}><span className="label-small">Title</span><input className={admin.input} placeholder="Add a title" /></label><label className={admin.field}><span className="label-small">Description</span><textarea className={admin.textarea} placeholder="Add supporting context" rows={3} /></label><label className={admin.field}><span className="label-small">Status</span><select className={admin.input} defaultValue="draft"><option value="draft">Draft</option><option value="published">Published</option></select></label><label className={admin.checkboxField}><input type="checkbox" role="switch" checked={toggle} onChange={(event) => setToggle(event.target.checked)} /><span className={admin.switch} aria-hidden="true" /><span>{toggle ? "Visible on site" : "Hidden from site"}</span></label></div></Example>
      <Example title="Tag suggestions" rule="Suggestions appear after two characters, with up to five matches. Select one or press Enter to add a custom tag."><div className={styles.formDemo}><label className={admin.field}><span className="label-small">Tags</span><input className={admin.input} value={tagDraft} onChange={(event) => setTagDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTag(tagDraft); } }} placeholder="Try typing design" /></label><TagSuggestions draft={tagDraft} existingTags={["Design systems", "Design operations", "Product design", "Governance", "Research"]} selectedTags={tags} onSelect={addTag} /><div className={styles.tags}>{tags.map((tag) => <button type="button" key={tag} onClick={() => setTags(tags.filter((item) => item !== tag))} aria-label={`Remove ${tag}`}>{tag} ×</button>)}</div></div></Example>
    </Section>

    <Section id="filters" eyebrow="COMPONENTS / 03" title="Filters & tabs" description="Filters change the visible set; tabs group related views. The selected state stays visible and each option can be reached by keyboard.">
      <Example title="Selection pills" rule="The service template selector uses the same pills as the site's article filters."><ServiceTemplatePicker initial="all" templates={[["all", "All"], ["systems", "Design systems"], ["architecture", "Architecture"]]} /></Example>
      <Example title="Content tabs" rule="This is the same tab component used by the admin editors. Use arrow keys to move between tabs."><AdminContentTabs tabs={[{ id: "published", label: "Published", content: <p className="body-small">Showing the published view.</p> }, { id: "drafts", label: "Drafts", content: <p className="body-small">Showing the drafts view.</p> }]} /></Example>
    </Section>

    <Section id="cards" eyebrow="COMPONENTS / 04" title="Content cards" description="Cards represent real content objects. The shared article card can also present a related case study, with the appropriate label and action."><Example title="Article and case-study variants" rule="Hover or focus the cards to see their states. These examples are illustrative and do not navigate."><div className={styles.cardGrid} onClickCapture={(event) => event.preventDefault()}><ArticleCard previewOnly slug="example" title="A clearer way to build together" excerpt="An example article about decisions, systems and the people who use them." category="DESIGN SYSTEMS" meta="8 MIN READ" showThumbnail={false} /><ArticleCard previewOnly slug="example" variant="caseStudy" title="From fragmented patterns to shared foundations" excerpt="An example of a project where common decisions changed how a product evolved." category="CASE STUDY" meta="2024" showThumbnail={false} /></div></Example></Section>

    <Section id="upload" eyebrow="COMPONENTS / 05" title="File upload" description="The CV upload presents its empty and selected states in the About hero editor. The example below is local to this page and does not save a file."><Example title="CV upload" rule="PDF files are limited to 5 MB. The real editor applies replacement or removal when the section is saved."><CvUpload currentUrl="" currentName="" currentSize="" /></Example></Section>

    <Section id="image-upload" eyebrow="ADMIN COMPONENTS" title="Image upload" description="The image field used in content editors previews a chosen file before the surrounding form is saved."><Example title="Image upload" rule="Choose an image to see the local preview; this example does not submit a file."><ImageField name="example_image" /></Example></Section>

    <Section id="metadata" eyebrow="ADMIN COMPONENTS" title="Metadata fields" description="The metadata controls used by page and content editors group search and sharing information."><Example title="Metadata fields" rule="Try the fields and index switch. This example does not save changes."><MetadataFields /></Example></Section>

    <Section id="rich-text" eyebrow="ADMIN COMPONENTS" title="Rich text editor" description="The editor used for article and case-study content supports formatted text and embedded media."><Example title="Rich text editor" rule="Try the toolbar and formatting. This example holds content and images locally; it does not save them."><RichTextEditor name="example_body" defaultValue="<p>Select this text to explore the formatting controls.</p>" previewOnly /></Example></Section>

    <Section id="reorder" eyebrow="ADMIN COMPONENTS" title="Reorderable list" description="The same list component used in admin content screens supports drag reordering."><Example title="Reorderable list" rule="Drag a handle to move a row. This example keeps the order in the browser and does not save it."><ReorderableList className={admin.list} itemClassName={admin.listItem} handleOnly onReorder={(order) => setReorderStatus(`Order: ${order.join(", ")}`)} items={[{id:"First",node:<span>First item</span>},{id:"Second",node:<span>Second item</span>},{id:"Third",node:<span>Third item</span>}]} /><p className={styles.demoStatus} role="status">{reorderStatus || "Drag an item to change the order."}</p></Example></Section>

    <Section id="admin-editors" eyebrow="ADMIN COMPONENTS" title="Admin editors" description="The larger editors compose shared controls with content-specific data and save actions. Their project source is available below; use them in their corresponding admin routes rather than submitting example data here."><p className={styles.rule}>Includes the article and case-study editors, service editor, inline section editor, navigation and footer previews, and site identity editor.</p></Section>

    <Section id="icons" eyebrow="COMPONENTS / 06" title="Icons" description="The admin uses the Lattice icon set as monochrome masks, so icons follow the current text colour. Pair an icon with a clear accessible label. Select an icon for its usage code."><div className={styles.iconGrid}>{icons.map((name) => <button type="button" className={styles.iconItem} key={name} aria-pressed={selectedIcon === name} onClick={() => setSelectedIcon(name)}><AdminIcon name={name} /><code>{name}</code></button>)}</div><CodeBlock label={`Using ${selectedIcon} · TSX`} code={`import { AdminIcon } from "@/components/admin/AdminIcon/AdminIcon";\n\n<AdminIcon name=${JSON.stringify(selectedIcon)} />`} />{iconSources[selectedIcon] && <details className={styles.sourceDetails}><summary>SVG source for {selectedIcon}</summary><CodeBlock label={`public/assets/lattice/${selectedIcon}.svg`} code={iconSources[selectedIcon]} /></details>}</Section>

    <Section id="feedback" eyebrow="PATTERNS / 01" title="Feedback & empty states" description="Explain what happened and offer a useful next step. Empty states belong in the page rather than appearing as unexplained gaps.">
      <Example title="Callouts" rule="Use a callout when a decision, outcome, constraint or note needs to stand out within content."><div className={styles.callouts}><Callout variant="note">A short piece of context for the reader.</Callout><Callout variant="decision">The team agreed on a shared direction.</Callout><Callout variant="outcome">The change made the next step clearer.</Callout><Callout variant="constraint">The work needed to fit an existing platform.</Callout></div></Example>
      <Example title="Empty state" rule="Say what is missing and offer a route forward where one exists."><EmptyState eyebrow={emptyAction ? "DEMONSTRATION" : "NO RESULTS"} title={emptyAction ? "Collection restored." : "Nothing here yet."} description={emptyAction ? "The example action returned to the collection." : "Try another filter or return to the full collection."} action={<Button variant="secondary" onClick={() => setEmptyAction(!emptyAction)}>{emptyAction ? "Reset example" : "View all"}</Button>} /></Example>
    </Section>

    <Section id="patterns" eyebrow="PATTERNS / 02" title="Process & disclosure" description="Use process steps when sequence is meaningful. Use plus and minus icons to expand and collapse content; reserve chevrons for navigation to another section or page.">
      <Example title="Process stepper" rule="The shared stepper numbers and labels each stage in order, adapting its layout to the available space."><ProcessStepper steps={[{id:1,title:"Understand",description:"Bring the context into view."},{id:2,title:"Decide",description:"Choose where action is useful."},{id:3,title:"Learn",description:"Use evidence to guide the next step."}]} /></Example>
      <Example title="Disclosure" rule="The section editor uses a native disclosure and shared card styles. Expand it to reveal its content."><div className={sectionCardStyles.card}><details className={sectionCardStyles.details}><summary className={sectionCardStyles.summary}><strong className="body-default">Section title</strong><span className={sectionCardStyles.expandIcon} aria-hidden="true"><AdminIcon name="action-plus" className={sectionCardStyles.expandPlus} /><AdminIcon name="action-minus" className={sectionCardStyles.expandMinus} /></span></summary><p className={styles.disclosureContent}>Section controls and the live preview appear here.</p></details></div></Example>
    </Section>

    <Section id="layouts" eyebrow="PATTERNS / 03" title="Page composition" description="Combine sections, typography, dividers and relationships to reflect the content. Avoid treating every piece of information as a card."><Example title="Section anatomy" rule="This shared service section header introduces the subject with an eyebrow, a heading and supporting copy."><ServiceSectionHeader eyebrow="SECTION EYEBROW" title="A clear, useful heading." description="Supporting copy provides context before the next piece of content." /></Example></Section>
  </div></LibraryContext.Provider>;
}
