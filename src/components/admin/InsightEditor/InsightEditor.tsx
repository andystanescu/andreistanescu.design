"use client";

import { useState } from "react";
import { RichTextEditor } from "@/components/admin/RichTextEditor/RichTextEditor";
import { ImageField } from "@/components/admin/ImageField/ImageField";
import { MetadataFields } from "@/components/admin/MetadataFields/MetadataFields";
import type { Insight } from "@/data/insights";
import styles from "@/app/admin/(dashboard)/admin.module.css";
import tagStyles from "@/components/admin/CaseStudyEditor/CaseStudyEditor.module.css";
import editorStyles from "@/components/admin/CaseStudyEditor/CaseStudyEditor.module.css";
import { dateInputValue, todayInputValue } from "@/lib/dateUtils";

type Props = { action: string; categories: Array<{ id: number; title: string }>; settingsAuthor: string; authorAvatarUrl?: string; insight?: Insight };

export function InsightEditor({ action, categories, settingsAuthor, authorAvatarUrl, insight }: Props) {
  const editing = Boolean(insight);
  const [tab, setTab] = useState<"details" | "body" | "metadata">("details");
  const value = (key: keyof Insight) => insight?.[key] ?? "";
  return <form data-editor-page className={`${styles.form} ${editorStyles.editorForm}`} action={action} method="POST" encType="multipart/form-data">
    <header className={editorStyles.editorHeader}>
      <div className={editorStyles.editorHeading}><p className={editorStyles.editorEyebrow}>ADMIN · INSIGHT</p><h1>{editing ? String(value("title")) : "New article"}</h1></div>
      <div className={editorStyles.editorActions}><button type="submit" name="intent" value={editing ? "publish" : "draft"} className={editorStyles.headerSubmit}>{editing ? "Save changes" : "Create article"}</button></div>
      <div className={editorStyles.tabs} role="tablist" aria-label="Insight details">
        {(["details", "body", "metadata"] as const).map((value) => <button key={value} type="button" role="tab" aria-selected={tab === value} aria-controls={`insight-panel-${value}`} className={tab === value ? editorStyles.tabActive : editorStyles.tab} onClick={() => setTab(value)}>{value === "metadata" ? "Metadata and SEO" : value === "body" ? "Body" : "Details"}</button>)}
      </div>
    </header>
    <div className={editorStyles.editorLayout}>
    <div className={editorStyles.editorMain}>
    <section id="insight-panel-details" role="tabpanel" aria-label="Details" hidden={tab !== "details"} className={editorStyles.panel}>
        <Field label="Slug (used in the URL: /insights/…)" name="slug" value={value("slug")} required />
        <Field label="Title" name="title" value={value("title")} required />
        <Field label="Excerpt (shown on cards and listings)" name="excerpt" value={value("excerpt")} textarea required />
        <CategoryCards value={String(value("category"))} categories={categories} />
        <TagEditor initialValue={String(value("tags"))} />
        <label className={styles.field}><span className="label-small">Published date</span><input type="date" name="published_at" defaultValue={dateInputValue(String(value("published_at")) || todayInputValue())} className={styles.input} /></label>
        {editing && <label className={styles.checkboxField}><input type="checkbox" name="published" defaultChecked={Boolean(insight?.published)} /><span className={styles.switch} aria-hidden="true" /><span className="body-default">Published</span></label>}
    </section>
    <section id="insight-panel-body" role="tabpanel" aria-label="Body" hidden={tab !== "body"} className={editorStyles.panel}>
        <div className={`${styles.field} ${styles.fieldWide}`}><span className="label-small">Body</span><RichTextEditor name="body" defaultValue={String(value("body"))} /></div>
    </section>
    <section id="insight-panel-metadata" role="tabpanel" aria-label="Metadata and SEO" hidden={tab !== "metadata"} className={editorStyles.panel}>
      <div className={styles.helper}><span className="body-default">Search appearance</span><p className="body-small">Set the title, description, canonical URL, and social image used for this article.</p></div><MetadataFields values={insight} />
    </section>
    </div>
    <aside className={editorStyles.sidePanels} aria-label="Insight summary">
      <div className={editorStyles.sidePanel}>
        <h2 className="heading-03">Visibility</h2>
        <p><span>Status</span><strong>{insight?.published ? "Published" : "Draft"}</strong></p>
        <p><span>Author</span><strong>{settingsAuthor || "Not set"}</strong></p>
        <hr />
        <small>{insight?.published ? "Visible on the live site." : "Not visible on the live site until published."}</small>
      </div>
      <div className={editorStyles.sidePanel}>
        <h2 className="heading-03">Media</h2>
        <label className={`${styles.field} ${styles.fieldWide}`}><span className="label-small">Cover image (shown at the top of the article)</span><ImageField name="cover_image" currentUrl={String(value("cover_image"))} /></label>
        <label className={`${styles.field} ${styles.fieldWide}`}><span className="label-small">Thumbnail image (shown on cards and listings)</span><ImageField name="thumbnail_image" currentUrl={String(value("thumbnail_image"))} /></label>
      </div>
      <div className={editorStyles.sidePanel}>
        <h2 className="heading-03">Author</h2>
          <div className={editorStyles.authorAvatar}><img src={authorAvatarUrl || "/assets/logo-icon-nav.svg"} alt="" aria-hidden="true" /><span>{settingsAuthor || "Not set"}</span></div>
        <small>Applied automatically from Settings when this article is saved.</small>
      </div>
    </aside>
    </div>
  </form>;
}

function Field({ label, name, value, textarea = false, required = false, placeholder }: { label: string; name: string; value: string | number; textarea?: boolean; required?: boolean; placeholder?: string }) {
  return <label className={styles.field}><span className="label-small">{label}</span>{textarea ? <textarea name={name} defaultValue={String(value)} required={required} placeholder={placeholder} className={styles.textarea} /> : <input type="text" name={name} defaultValue={String(value)} required={required} placeholder={placeholder} className={styles.input} />}</label>;
}

function CategoryCards({ value, categories }: { value: string; categories: Array<{ id: number; title: string }> }) {
  const [selected, setSelected] = useState(value);
  return <div className={styles.field}><span className="label-small">Category (shown in the breadcrumb and hero eyebrow)</span><input type="hidden" name="category" value={selected} /><div className={editorStyles.categoryCards} role="group" aria-label="Insight category">{categories.map((category) => <button key={category.id} type="button" className={selected === category.title ? editorStyles.categoryCardActive : editorStyles.categoryCard} aria-pressed={selected === category.title} onClick={() => setSelected(category.title)}><strong>{category.title}</strong><small>{category.title.toLowerCase().replace(/\s+/g, "-")}</small></button>)}</div>{categories.length === 0 && <p className="body-small">Add a service before selecting a category.</p>}</div>;
}

function TagEditor({ initialValue }: { initialValue: string }) {
  const [tags, setTags] = useState(() => initialValue.split(/[,;\n|*·]+/).map((tag) => tag.trim()).filter(Boolean));
  const [draft, setDraft] = useState("");
  const addTags = () => {
    const incoming = draft.split(/[,;\n|*·]+/).map((tag) => tag.trim()).filter(Boolean);
    if (!incoming.length) return;
    setTags((current) => [...current, ...incoming.filter((tag) => !current.some((existing) => existing.toLowerCase() === tag.toLowerCase()))]);
    setDraft("");
  };
  const removeTag = (tagToRemove: string) => setTags((current) => current.filter((tag) => tag !== tagToRemove));

  return <div className={styles.field}>
    <span className="label-small">Tags</span>
    <input type="hidden" name="tags" value={tags.join(", ")} />
    <div className={tagStyles.tagComposer}>
      <input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTags(); } }} placeholder="Add one tag or paste several separated by commas" className={styles.input} />
      <button type="button" className={tagStyles.addTagButton} onClick={addTags}>Add tags</button>
    </div>
    <div className={tagStyles.tagList} aria-label="Added tags">
      {tags.map((tag) => <span className={tagStyles.tag} key={tag}>{tag}<button type="button" aria-label={`Remove ${tag}`} onClick={() => removeTag(tag)}>×</button></span>)}
    </div>
    <small className={tagStyles.tagHint}>Only tags shown here are published. Separate multiple tags with commas.</small>
  </div>;
}
