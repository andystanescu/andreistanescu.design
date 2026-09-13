"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ImageField } from "@/components/admin/ImageField/ImageField";
import { RichTextEditor } from "@/components/admin/RichTextEditor/RichTextEditor";
import type { CaseStudy, CaseStudyMetric } from "@/data/caseStudies";
import type { CaseStudyAssessment } from "@/data/caseStudyAssessment";
import { assessmentCriteriaList, generateActivityRecommendations, getActivityDescription, getPrimaryComplexityDrivers } from "@/data/caseStudyAssessment";
import styles from "./CaseStudyEditor.module.css";
import adminStyles from "@/app/admin/(dashboard)/admin.module.css";
import { dateInputValue } from "@/lib/dateUtils";
import { MetadataFields } from "@/components/admin/MetadataFields/MetadataFields";
import Link from "next/link";

type ServiceOption = { slug: string; title: string };
type PasswordEntry = { name: string; masked: string };
type Props = { study: CaseStudy; metrics: CaseStudyMetric[]; assessment: CaseStudyAssessment; services: ServiceOption[]; relatedInsights: Array<{ slug: string; title: string }>; passwordRequired: boolean; passwordEntries: PasswordEntry[]; authorAvatarUrl?: string; action?: string };
type Tab = "details" | "outcomes" | "assessment" | "content" | "metadata" | "visibility";

export function CaseStudyEditor({ study, metrics, assessment, services, relatedInsights, passwordRequired, passwordEntries, authorAvatarUrl, action }: Props) {
  const editing = study.id > 0;
  const [tab, setTab] = useState<Tab>(editing ? "content" : "details");
  const studyAuthor = "author" in study && typeof study.author === "string" ? study.author : "";
  const publishedDate = "published_at" in study && typeof study.published_at === "string" ? study.published_at : "";
  const formRef = useRef<HTMLFormElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "saving" | "error">("idle");
  const [scores, setScores] = useState<Record<string, string>>(() => Object.fromEntries(assessmentCriteriaList.map((criterion) => [criterion.key, String(assessment.scores[criterion.key] ?? "")] )));
  const overallOptions = ["Focused engagement", "Defined initiative", "Strategic initiative", "Transformation programme", "Enterprise programme"];
  const overallDescriptions: Record<string, string> = { "Focused engagement": "A contained piece of work with a clear problem, owner, and delivery path.", "Defined initiative": "A bounded initiative involving a small number of teams, decisions, or dependencies.", "Strategic initiative": "A meaningful piece of work that influences product direction, priorities, or ways of working.", "Transformation programme": "A sustained change across products, teams, systems, or organisational practices.", "Enterprise programme": "A broad, high-stakes programme requiring organisation-wide coordination and long-term governance." };
  const suggestedOverall = useMemo(() => {
    const values = Object.values(scores).map(Number).filter((value) => value >= 1 && value <= 5);
    if (values.length === 0) return overallOptions.includes(assessment.overall) ? assessment.overall : "";
    return overallOptions[Math.max(0, Math.min(4, Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) - 1))];
  }, [assessment.overall, scores]);
  const [overallOverride, setOverallOverride] = useState<string | null>(assessment.overall || null);
  const overallLabel = overallOverride || suggestedOverall;
  const primaryDrivers = useMemo(() => getPrimaryComplexityDrivers(Object.fromEntries(Object.entries(scores).map(([key, value]) => [key, Number(value)]))), [scores]);
  const recommendations = useMemo(() => generateActivityRecommendations(Object.fromEntries(Object.entries(scores).map(([key, value]) => [key, Number(value)]))), [scores]);
  const [notApplicable, setNotApplicable] = useState<string[]>(assessment.notApplicable);
  const recommendationGroups = useMemo(() => assessmentCriteriaList.map((criterion) => ({
    criterion,
    activities: recommendations.filter((activity) => activity.triggeredBy[0]?.criterion === criterion.key),
  })).filter((group) => group.activities.length > 0), [recommendations]);
  const saveDraft = async () => {
    const form = formRef.current;
    if (!form) return;
    const formData = new FormData(form);
    formData.set("intent", "draft");
    setSaveState("saving");
    try {
      const response = await fetch(form.action, { method: "POST", body: formData });
      if (!response.ok) throw new Error("Draft save failed");
      setSaveState("saved");
      if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
      saveStatusTimerRef.current = setTimeout(() => setSaveState("idle"), 5000);
    } catch {
      setSaveState("error");
    }
  };
  const scheduleDraftSave = () => {
    if (!editing) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
    setSaveState("saving");
    saveTimerRef.current = setTimeout(() => void saveDraft(), 700);
  };
  useEffect(() => () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
  }, []);
  return (
    <form ref={formRef} data-editor-page className={`${adminStyles.form} ${styles.editorForm}`} action={action ?? `/api/admin/case-studies/${study.id}`} method="POST" encType="multipart/form-data" onInput={scheduleDraftSave} onChange={scheduleDraftSave}>
      <header className={styles.editorHeader}>
          <div className={styles.editorHeading}><p className={styles.editorEyebrow}>ADMIN · CASE STUDY</p><h1>{editing ? study.title : "New case study"}</h1></div>
          <div className={styles.editorActions}>{saveState !== "idle" && <span className={styles.saveStatus}>{saveState === "saving" ? "Saving…" : saveState === "error" ? "Save failed" : "Saved"}</span>}{editing && <Link href={`/work/${encodeURIComponent(study.slug)}?preview=1`} target="_blank" className={adminStyles.secondaryButton}>Preview</Link>}<Link href="/admin/case-studies" className={adminStyles.tertiaryButton}>Cancel</Link><button type="submit" name="intent" value={editing ? "publish" : "draft"} className={adminStyles.submit}>{editing ? "Publish" : "Create case study"}</button></div>
        <div className={styles.tabs} role="tablist" aria-label="Case study details">
        {(["details", "outcomes", "assessment", "content", "metadata", "visibility"] as const).map((value) => (
          <button key={value} id={`case-study-tab-${value}`} type="button" role="tab" aria-selected={tab === value} aria-controls={`case-study-panel-${value}`} tabIndex={tab === value ? 0 : -1} className={tab === value ? styles.tabActive : styles.tab} onClick={() => setTab(value)}>
            {value === "details" ? "Details" : value === "outcomes" ? "Outcomes" : value === "assessment" ? "Assessment" : value === "metadata" ? "Metadata and SEO" : value === "visibility" ? "Visibility" : "Content"}
          </button>
        ))}
        </div>
      </header>

      <div className={styles.editorLayout}>
      <div className={styles.editorMain}>
      <section id="case-study-panel-details" role="tabpanel" aria-labelledby="case-study-tab-details" hidden={tab !== "details"} className={styles.panel} aria-label="Case study details">
        {services.length < 8 ? <CategoryCards value={study.category} services={services} /> : <Field label="Category (from Services)"><select name="category" defaultValue={study.category} className={adminStyles.input}><option value="">Select a service category</option>{services.map((service) => <option key={service.slug} value={service.title}>{service.title}</option>)}</select></Field>}
        <Field label="Year"><select name="year" defaultValue={study.year} className={adminStyles.input}><option value="">Select a year</option>{Array.from({ length: new Date().getFullYear() - 2014 }, (_, index) => String(new Date().getFullYear() - index)).map((year) => <option key={year} value={year}>{year}</option>)}</select></Field>
        <Field label="Slug (used in the URL: /work/…)" ><input name="slug" defaultValue={study.slug} required className={adminStyles.input} /></Field>
        <Field label="Eyebrow"><input name="eyebrow" defaultValue={study.eyebrow} className={adminStyles.input} /></Field>
        <Field label="Title"><input name="title" defaultValue={study.title} required className={adminStyles.input} /></Field>
        <Field label="Description"><textarea name="description" defaultValue={study.description} required className={adminStyles.textarea} /></Field>
        <Field label="Published date"><input type="date" name="published_at" defaultValue={dateInputValue(publishedDate)} className={adminStyles.input} /></Field>
        <TagEditor initialValue={study.tags} onCommit={scheduleDraftSave} />
      </section>

      <section id="case-study-panel-outcomes" role="tabpanel" aria-labelledby="case-study-tab-outcomes" hidden={tab !== "outcomes"} className={styles.panel} aria-label="Case study outcomes">
        <Field label="Outcomes eyebrow"><input name="outcome_eyebrow" defaultValue={study.outcome_eyebrow || "OUTCOMES"} className={adminStyles.input} /></Field>
        <Field label="Outcomes title"><input name="outcome_title" defaultValue={study.outcome_title} className={adminStyles.input} /></Field>
        <div className={adminStyles.field}><span className="label-small" style={{ color: "var(--text-secondary)" }}>Metrics (up to 6)</span>{Array.from({ length: 6 }, (_, i) => { const metric = metrics[i]; return <div key={i} className={styles.metricRow}><input name={`metric_${i + 1}_value`} defaultValue={metric?.value} placeholder="40+" className={adminStyles.input} /><input name={`metric_${i + 1}_label`} defaultValue={metric?.label} placeholder="Reusable components" className={adminStyles.input} /></div>; })}</div>
      </section>

      <section id="case-study-panel-assessment" role="tabpanel" aria-labelledby="case-study-tab-assessment" hidden={tab !== "assessment"} className={styles.panel} aria-label="ConScept engagement assessment">
        <div className={styles.sectionIntro}><span className="label-eyebrow">ConScept engagement assessment</span><p className="body-default">Record the complexity you observed, what the assessment suggests, and what was actually conducted.</p></div>
        <div className={styles.assessmentGrid}>
          <div><h2 className="heading-03">Complexity scores</h2>{assessmentCriteriaList.map((criterion) => { const selectedScore = Number(scores[criterion.key]); const selectedLevel = selectedScore >= 1 && selectedScore <= 5 ? criterion.levels[selectedScore as 1 | 2 | 3 | 4 | 5] : undefined; return <div className={styles.scoreRow} key={criterion.key}><div><strong>{criterion.label}{primaryDrivers.includes(criterion.key) && <span className={styles.driverBadge}>Primary driver</span>}</strong><small>{criterion.question}</small><input type="hidden" name={`assessment_score_${criterion.key}`} value={scores[criterion.key]} /></div><div className={styles.scoreControl}><div className={styles.segmented} role="group" aria-label={`${criterion.label} score`}>{([1, 2, 3, 4, 5] as const).map((score) => <button key={score} type="button" className={scores[criterion.key] === String(score) ? styles.segmentActive : styles.segment} aria-pressed={scores[criterion.key] === String(score)} onClick={() => setScores((current) => ({ ...current, [criterion.key]: String(score) }))}><span>{score}</span><small>{criterion.levels[score].label}</small></button>)}</div>{selectedLevel && <p className={styles.scoreDescription}>{selectedLevel.description}</p>}</div></div>; })}</div>
          <div><h2 className="heading-03">Overall complexity</h2><input type="hidden" name="assessment_overall" value={overallLabel} /><p className="body-small">A default is selected from the completed scores. You can choose another label without changing the scores.</p><div className={styles.overallOptions} role="group" aria-label="Overall complexity">{overallOptions.map((label) => <button key={label} type="button" className={overallLabel === label ? styles.overallOptionActive : styles.overallOption} aria-pressed={overallLabel === label} onClick={() => setOverallOverride(label)}><strong>{label}</strong><small>{overallDescriptions[label]}</small></button>)}</div><Field label="Additional details"><textarea name="assessment_overall_description" defaultValue={assessment.overallDescription} placeholder="What makes this engagement complex?" className={adminStyles.textarea} /></Field></div>
        </div>
        <div className={styles.engagement}><div className={styles.engagementHeader}><div><h2 className="heading-03">Engagement activities</h2><p className="body-small">Activities are grouped by their primary driving metric. Mark completed work as conducted, or exclude an activity when it did not apply.</p></div></div>{recommendations.length === 0 && <p className="body-small">Add one or more scores to generate recommendations.</p>}{recommendationGroups.map(({ criterion, activities }) => <section className={styles.activityGroup} key={criterion.key}><div className={styles.activityGroupHeader}><h3>{criterion.label}</h3><span>{scores[criterion.key] || "—"} / 5</span></div><div className={styles.activityGrid}>{[...activities].sort((left, right) => Number(notApplicable.includes(left.name)) - Number(notApplicable.includes(right.name))).map((activity) => { const excluded = notApplicable.includes(activity.name); return <article key={activity.name} className={`${styles.activityCard} ${excluded ? styles.activityCardExcluded : ""}`}><div className={styles.activityCardTop}><div className={styles.activityInfo}><strong>{activity.name}</strong><p className={styles.activityDescription}>{getActivityDescription(activity.name)}</p>{activity.triggeredBy.length > 1 && <small>Also driven by {activity.triggeredBy.slice(1).map((trigger) => assessmentCriteriaList.find((item) => item.key === trigger.criterion)?.label).filter(Boolean).join(" · ")}</small>}</div><label className={`${styles.conductedControl} ${styles.switch}`} title={excluded ? "Make this activity applicable before marking it conducted" : "Mark as conducted"}><input type="checkbox" name="assessment_conducted" value={activity.name} defaultChecked={assessment.conducted.includes(activity.name)} disabled={excluded} aria-label={`${activity.name}: conducted`} /><span aria-hidden="true" /></label></div>{!excluded && <input type="hidden" name="assessment_likely" value={activity.name} />}<footer className={styles.activityFooter}><label className={styles.activityChoice}><input type="checkbox" name="assessment_not_applicable" value={activity.name} checked={excluded} onChange={(event) => setNotApplicable((current) => event.target.checked ? [...current, activity.name] : current.filter((name) => name !== activity.name))} /><span>Not applicable</span></label></footer></article>; })}</div></section>)}</div>
      </section>

      <section id="case-study-panel-content" role="tabpanel" aria-labelledby="case-study-tab-content" hidden={tab !== "content"} className={styles.panel} aria-label="Case study content">
        <p className="body-small">Your changes save automatically as a draft. Use Publish when the case study is ready to go live.</p>
        <div className={`${adminStyles.field} ${adminStyles.fieldWide}`}><span className="label-small" style={{ color: "var(--text-secondary)" }}>Body</span><RichTextEditor name="body" defaultValue={study.body} onContentChange={scheduleDraftSave} relatedInsights={relatedInsights} /></div>
      </section>

      <section id="case-study-panel-metadata" role="tabpanel" aria-labelledby="case-study-tab-metadata" hidden={tab !== "metadata"} className={styles.panel} aria-label="Case study metadata and SEO">
        <div className={styles.sectionIntro}><span className="label-eyebrow">Metadata and SEO</span><p className="body-default">Control how this case study appears in search results and when it is shared.</p></div>
        <MetadataFields values={study} />
      </section>

      <section id="case-study-panel-visibility" role="tabpanel" aria-labelledby="case-study-tab-visibility" hidden={tab !== "visibility"} className={styles.panel} aria-label="Case study visibility">
        <div className={styles.sectionIntro}><span className="label-eyebrow">Visibility</span><p className="body-default">Control what visitors can see while you develop and publish this case study.</p></div>
        <label className={styles.visibilitySwitch}><span><strong>In progress</strong><small>Keep the introduction and outcomes live, while replacing the assessment and full write-up with an In Progress message.</small></span><input type="checkbox" name="in_progress" defaultChecked={Boolean(study.in_progress)} /><span aria-hidden="true" /></label>
        <label className={styles.visibilitySwitch}><span><strong>Password required</strong><small>When enabled, visitors must enter one of the accepted passwords before viewing this case study.</small></span><input type="checkbox" name="password_required" defaultChecked={passwordRequired} /><span aria-hidden="true" /></label>
        <div className={styles.passwordManager}><div className={styles.passwordManagerHeader}><div><h2 className="heading-03">Accepted passwords</h2><p className="body-small">{passwordEntries.length} active {passwordEntries.length === 1 ? "password" : "passwords"}. New passwords remain visible until this draft is saved.</p></div></div><PasswordManager passwordEntries={passwordEntries} onCommit={scheduleDraftSave} /></div>
      </section>

      </div>
      <aside className={styles.sidePanels} aria-label="Case study summary">
        <div className={styles.sidePanel}>
          <h2 className="heading-03">Visibility</h2>
          <p><span>Status</span><strong>{study.published ? study.in_progress ? "In progress" : "Published" : "Draft"}</strong></p>
          <p><span>Author</span><strong>{studyAuthor || "Not set"}</strong></p>
          <hr />
          <small>{study.published ? study.in_progress ? "The introduction and outcomes are live; the full write-up remains hidden." : "Visible on the live site." : "Not visible on the live site until published."}</small>
        </div>
        <div className={styles.sidePanel}>
          <h2 className="heading-03">Media</h2>
          <Field label="Cover image (shown at the top of the case study)"><ImageField name="cover_image" currentUrl={study.cover_image} /></Field>
          <Field label="Thumbnail image (shown on cards and listings)"><ImageField name="thumbnail_image" currentUrl={study.thumbnail_image} /></Field>
        </div>
        <div className={styles.sidePanel}>
          <h2 className="heading-03">Author</h2>
          <div className={styles.authorAvatar}><img src={authorAvatarUrl || "/assets/logo-icon-nav.svg"} alt="" aria-hidden="true" /><span>{studyAuthor || "Not set"}</span></div>
          <small>Applied automatically from Settings when this case study is saved.</small>
        </div>
      </aside>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className={adminStyles.field}><span className="label-small" style={{ color: "var(--text-secondary)" }}>{label}</span>{children}</label>; }

function CategoryCards({ value, services }: { value: string; services: ServiceOption[] }) {
  const [selected, setSelected] = useState(value);
  return <div className={adminStyles.field}><span className="label-small" style={{ color: "var(--text-secondary)" }}>Category (from Services)</span><input type="hidden" name="category" value={selected} /><div className={styles.categoryCards} role="group" aria-label="Case study category">{services.map((service) => <button key={service.slug} type="button" className={selected === service.title ? styles.categoryCardActive : styles.categoryCard} aria-pressed={selected === service.title} onClick={() => setSelected(service.title)}><strong>{service.title}</strong><small>{service.slug}</small></button>)}</div>{services.length === 0 && <p className="body-small">Add a service before selecting a category.</p>}</div>;
}

function TagEditor({ initialValue, onCommit }: { initialValue: string; onCommit: () => void }) {
  const [tags, setTags] = useState(() => initialValue.split(/[,;\n|*·]+/).map((tag) => tag.trim()).filter(Boolean));
  const [draft, setDraft] = useState("");
  const addTags = () => {
    const incoming = draft.split(/[,;\n|*·]+/).map((tag) => tag.trim()).filter(Boolean);
    if (!incoming.length) return;
    setTags((current) => [...current, ...incoming.filter((tag) => !current.some((existing) => existing.toLowerCase() === tag.toLowerCase()))]);
    setDraft("");
    onCommit();
  };
  const removeTag = (tagToRemove: string) => { setTags((current) => current.filter((tag) => tag !== tagToRemove)); onCommit(); };
  return <div className={adminStyles.field}><span className="label-small" style={{ color: "var(--text-secondary)" }}>Tags</span><input type="hidden" name="tags" value={tags.join(" · ")} /><div className={styles.tagComposer}><input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTags(); } }} placeholder="Add one tag or paste several separated by commas" className={adminStyles.input} /><button type="button" className={styles.addTagButton} onClick={addTags}>Add tags</button></div><div className={styles.tagList} aria-label="Added tags">{tags.map((tag) => <span className={styles.tag} key={tag}>{tag}<button type="button" aria-label={`Remove ${tag}`} onClick={() => removeTag(tag)}>×</button></span>)}</div><small className={styles.tagHint}>Only tags shown here are published. Separate multiple tags with commas, semicolons, or new lines.</small></div>;
}

function PasswordManager({ passwordEntries, onCommit }: { passwordEntries: PasswordEntry[]; onCommit: () => void }) {
  const [draft, setDraft] = useState("");
  const [draftName, setDraftName] = useState("");
  const [pending, setPending] = useState<Array<{ name: string; password: string }>>([]);
  const [removed, setRemoved] = useState<number[]>([]);
  const addPasswords = () => { const incoming = draft.split(/[,;\n|]+/).map((password) => password.trim()).filter(Boolean); if (!incoming.length) return; const name = draftName.trim() || "Unnamed guest"; setPending((current) => [...current, ...incoming.filter((password) => !current.some((item) => item.password === password)).map((password) => ({ name, password }))]); setDraft(""); setDraftName(""); onCommit(); };
  const removePending = (password: string) => { setPending((current) => current.filter((item) => item.password !== password)); onCommit(); };
  const removeExisting = (index: number) => { setRemoved((current) => [...current, index]); onCommit(); };
  return <><input type="hidden" name="password_add" value={JSON.stringify(pending)} />{removed.map((index) => <input type="hidden" name="password_remove" value={index} key={index} />)}{passwordEntries.length > 0 && <div className={styles.passwordCards} aria-label="Accepted passwords">{passwordEntries.map((entry, index) => !removed.includes(index) && <div className={styles.passwordCard} key={`${entry.name}-${index}`}><div><strong>{entry.name}</strong><span>{entry.masked}</span></div><button type="button" aria-label={`Remove password for ${entry.name}`} onClick={() => removeExisting(index)}>Remove</button></div>)}</div>}<div className={styles.passwordComposer}><input type="text" value={draftName} onChange={(event) => setDraftName(event.target.value)} placeholder="Name or person" className={adminStyles.input} /><input type="text" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addPasswords(); } }} placeholder="Enter a password" className={adminStyles.input} autoComplete="new-password" /><button type="button" className={styles.addTagButton} onClick={addPasswords}>Add password</button></div>{pending.length > 0 && <div className={styles.passwordCards} aria-label="Passwords queued to add">{pending.map((entry) => <div className={styles.passwordCard} key={entry.password}><div><strong>{entry.name}</strong><span>{entry.password}</span></div><button type="button" aria-label={`Remove pending password for ${entry.name}`} onClick={() => removePending(entry.password)}>Remove</button></div>)}</div>}<small className={styles.tagHint}>Give each password a name. New passwords are visible while editing and become masked after saving.</small></>;
}
