"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { TagSuggestions } from "@/components/admin/TagSuggestions/TagSuggestions";
import { AdminIcon } from "@/components/admin/AdminIcon/AdminIcon";
import type { ReactNode } from "react";
import { ImageField } from "@/components/admin/ImageField/ImageField";
import { RichTextEditor } from "@/components/admin/RichTextEditor/RichTextEditor";
import type { CaseStudy, CaseStudyMetric } from "@/data/caseStudies";
import type { CaseStudyAssessment, AssessmentActivityCategory, AssessmentActivity } from "@/data/caseStudyAssessment";
import { assessmentCriteriaList, getAssessmentActivityCategories, getPrimaryComplexityDrivers } from "@/data/caseStudyAssessment";
import styles from "./CaseStudyEditor.module.css";
import filterStyles from "@/components/insights/InsightsListing/InsightsListing.module.css";
import adminStyles from "@/app/admin/(dashboard)/admin.module.css";
import { dateInputValue } from "@/lib/dateUtils";
import { MetadataFields } from "@/components/admin/MetadataFields/MetadataFields";
import Link from "next/link";
import type { RelatedReadingOption } from "@/lib/relatedReadings";
import { assessmentEditorBody } from "@/lib/assessmentPlacement";
import { parseCaseStudyOverview } from "@/lib/caseStudyOverview";
import { LiveComponentBlock } from "@/components/LiveComponentBlock/LiveComponentBlock";

type CategoryOption = { id: number; name: string };
type PasswordEntry = { name: string; masked: string; revealable?: boolean };
type Props = { study: CaseStudy; metrics: CaseStudyMetric[]; assessment: CaseStudyAssessment; categories: CategoryOption[]; selectedCategoryIds: number[]; relatedReadings: RelatedReadingOption[]; existingTags: string[]; passwordRequired: boolean; passwordEntries: PasswordEntry[]; authorAvatarUrl?: string; action?: string };
type Tab = "details" | "outcomes" | "overview" | "assessment" | "content" | "metadata" | "visibility";

export function CaseStudyEditor({ study, metrics, assessment, categories, selectedCategoryIds, relatedReadings, existingTags, passwordRequired, passwordEntries, authorAvatarUrl, action }: Props) {
  const editing = study.id > 0;
  const overview = parseCaseStudyOverview(study.overview);
  const [tab, setTab] = useState<Tab>(editing ? "content" : "details");
  const studyAuthor = "author" in study && typeof study.author === "string" ? study.author : "";
  const publishedDate = "published_at" in study && typeof study.published_at === "string" ? study.published_at : "";
  const formRef = useRef<HTMLFormElement>(null);
  const saveStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "saving" | "error">("idle");
  const [savedPasswords, setSavedPasswords] = useState(passwordEntries);
  const [pendingPasswords, setPendingPasswords] = useState<Array<{ name: string; password: string }>>([]);
  const [removedPasswords, setRemovedPasswords] = useState<number[]>([]);
  const hasLegacyAssessment = Boolean(assessment.overall || Object.values(assessment.scores).some(Boolean) || getAssessmentActivityCategories(assessment).some((category) => category.activities.some((activity) => activity.title.trim())));
  const prepareBody = (body: string) => assessmentEditorBody(body, assessment.placement, editing && hasLegacyAssessment);
  const initialWorkingBody = prepareBody(study.body_draft ?? study.body);
  const [bodyValue, setBodyValue] = useState(initialWorkingBody);
  const [bodyDraftEnabled, setBodyDraftEnabled] = useState(Boolean(study.body_draft_enabled));
  const [bodyEditorKey, setBodyEditorKey] = useState(0);
  const [heroCode, setHeroCode] = useState(study.hero_code_draft ?? study.hero_code ?? "");
  const [heroCodeOpen, setHeroCodeOpen] = useState(false);
  const bodyDiffersFromLive = bodyValue !== prepareBody(study.body);
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
  const [activityCategories, setActivityCategories] = useState<AssessmentActivityCategory[]>(() => getAssessmentActivityCategories(assessment));
  const [activeEngagementEdit, setActiveEngagementEdit] = useState<string | null>(null);
  const [activeCategoryEdit, setActiveCategoryEdit] = useState<string | null>(null);
  const updateEngagement = (categoryId: string, id: string, changes: Partial<AssessmentActivity>) => {
    setActivityCategories((current) => current.map((group) => group.id === categoryId ? { ...group, activities: group.activities.map((item) => item.id === id ? { ...item, ...changes } : item) } : group));
  };
  const addEngagement = (categoryId: string) => setActivityCategories((current) => current.map((group) => group.id === categoryId ? { ...group, activities: [...group.activities, { id: crypto.randomUUID(), title: "", description: "", status: "not_started" }] } : group));
  const removeEngagement = (categoryId: string, id: string) => setActivityCategories((current) => current.map((group) => group.id === categoryId ? { ...group, activities: group.activities.filter((item) => item.id !== id) } : group));
  const saveActivityCategories = async (nextGroups: AssessmentActivityCategory[]) => {
    if (!editing) return;
    const form = formRef.current;
    if (!form) return;
    const formData = new FormData(form);
    formData.set("intent", "save_assessment_engagements");
    formData.set("assessment_activity_categories", JSON.stringify(nextGroups));
    setSaveState("saving");
    try {
      const response = await fetch(form.action, { method: "POST", body: formData });
      if (!response.ok) throw new Error("Engagement save failed");
      setSaveState("saved");
      if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
      saveStatusTimerRef.current = setTimeout(() => setSaveState("idle"), 5000);
    } catch {
      setSaveState("error");
    }
  };
  const saveEngagementOnBlur = (categoryId: string, id: string, field: "title" | "description", value: string) => {
    const nextGroups = activityCategories.map((group) => group.id === categoryId ? { ...group, activities: group.activities.map((item) => item.id === id ? { ...item, [field]: value } : item) } : group);
    setActivityCategories(nextGroups);
    setActiveEngagementEdit(null);
    if (value.trim() || field !== "title") void saveActivityCategories(nextGroups);
  };
  const saveDraft = async () => {
    const form = formRef.current;
    if (!form) return;
    const formData = new FormData(form);
    formData.set("intent", "draft");
    setSaveState("saving");
    try {
      const response = await fetch(form.action, { method: "POST", body: formData });
      if (!response.ok) throw new Error("Draft save failed");
      const result = await response.json() as { passwordEntries?: PasswordEntry[] };
      if (Array.isArray(result.passwordEntries)) { setSavedPasswords(result.passwordEntries); setPendingPasswords([]); setRemovedPasswords([]); }
      setSaveState("saved");
      if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
      saveStatusTimerRef.current = setTimeout(() => setSaveState("idle"), 5000);
    } catch {
      setSaveState("error");
    }
  };
  const markUnsaved = () => {
    if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
    setSaveState("idle");
  };
  const discardBodyDraft = async () => {
    const form = formRef.current;
    if (!form) return;
    const formData = new FormData();
    formData.set("intent", "discard_body_draft");
    setSaveState("saving");
    try {
      const response = await fetch(form.action, { method: "POST", body: formData });
      if (!response.ok) throw new Error("Body draft discard failed");
      setBodyValue(prepareBody(study.body));
      setBodyDraftEnabled(false);
      setBodyEditorKey((key) => key + 1);
      setSaveState("saved");
      if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
      saveStatusTimerRef.current = setTimeout(() => setSaveState("idle"), 5000);
    } catch {
      setSaveState("error");
    }
  };
  return (
    <form ref={formRef} data-editor-page className={`${adminStyles.form} ${styles.editorForm}`} action={action ?? `/api/admin/case-studies/${study.id}`} method="POST" encType="multipart/form-data" onInput={markUnsaved} onChange={markUnsaved}>
      <input type="hidden" name="hero_code" value={heroCode} />
      <input type="hidden" name="assessment_placement" value={assessment.placement} />
      <header className={styles.editorHeader}>
          <div className={styles.editorHeading}><p className={styles.editorEyebrow}>ADMIN · CASE STUDY</p><h1>{editing ? study.title : "New case study"}</h1></div>
          <div className={styles.editorActions}>{saveState !== "idle" && <span className={styles.saveStatus}>{saveState === "saving" ? "Saving…" : saveState === "error" ? "Save failed" : "Saved"}</span>}{editing && <><button type="button" className={adminStyles.secondaryButton} onClick={() => void saveDraft()}>Save</button><Link href={`/work/${encodeURIComponent(study.slug)}?preview=1`} target="_blank" className={adminStyles.secondaryButton}>Preview</Link></>}<Link href="/admin/case-studies" className={adminStyles.tertiaryButton}>Cancel</Link><button type="submit" name="intent" value={editing ? "publish" : "draft"} className={adminStyles.submit}>{editing ? "Publish" : "Create case study"}</button></div>
        <div className={styles.tabs} role="tablist" aria-label="Case study details">
        {(["details", "outcomes", "overview", "assessment", "content", "metadata", "visibility"] as const).map((value) => (
          <button key={value} id={`case-study-tab-${value}`} type="button" role="tab" aria-selected={tab === value} aria-controls={`case-study-panel-${value}`} tabIndex={tab === value ? 0 : -1} className={tab === value ? styles.tabActive : styles.tab} onClick={() => setTab(value)}>
            {value === "details" ? "Details" : value === "outcomes" ? "Outcomes" : value === "overview" ? "Overview" : value === "assessment" ? "Assessment" : value === "metadata" ? "Metadata and SEO" : value === "visibility" ? "Visibility" : "Content"}
          </button>
        ))}
        </div>
      </header>

      <div className={styles.editorLayout}>
      <div className={styles.editorMain}>
      <section id="case-study-panel-details" role="tabpanel" aria-labelledby="case-study-tab-details" hidden={tab !== "details"} className={styles.panel} aria-label="Case study details">
        <CategoryCards categories={categories} selectedIds={selectedCategoryIds} />
        <Field label="Year"><select name="year" defaultValue={study.year} className={adminStyles.input}><option value="">Select a year</option>{Array.from({ length: new Date().getFullYear() - 2014 }, (_, index) => String(new Date().getFullYear() - index)).map((year) => <option key={year} value={year}>{year}</option>)}</select></Field>
        <Field label="Slug (used in the URL: /work/…)" ><input name="slug" defaultValue={study.slug} required className={adminStyles.input} /></Field>
        <Field label="Eyebrow"><input name="eyebrow" defaultValue={study.eyebrow} className={adminStyles.input} /></Field>
        <Field label="Title"><input name="title" defaultValue={study.title} required className={adminStyles.input} /></Field>
        <Field label="Description"><textarea name="description" defaultValue={study.description} required className={adminStyles.textarea} /></Field>
        <Field label="Role"><input name="project_role" defaultValue={study.project_role} placeholder="Product designer (one of two)" className={adminStyles.input} /></Field>
        <Field label="My contribution"><textarea name="contribution" defaultValue={study.contribution} placeholder="What you personally focused on, owned, or delivered" className={adminStyles.textarea} /><small className="body-small">Describe your own focus within the wider team effort.</small></Field>
        <Field label="Timeline"><input name="timeline" defaultValue={study.timeline} placeholder="January–June 2026" className={adminStyles.input} /></Field>
        <Field label="Scope"><input name="scope" defaultValue={study.scope} placeholder="Research, product strategy, interaction design" className={adminStyles.input} /></Field>
        <Field label="Team"><input name="team" defaultValue={study.team} placeholder="Product, design and engineering" className={adminStyles.input} /></Field>
        <Field label="Published date"><input type="date" name="published_at" defaultValue={dateInputValue(publishedDate)} className={adminStyles.input} /></Field>
        <TagEditor initialValue={study.tags} existingTags={existingTags} onCommit={markUnsaved} />
      </section>

      <section id="case-study-panel-outcomes" role="tabpanel" aria-labelledby="case-study-tab-outcomes" hidden={tab !== "outcomes"} className={styles.panel} aria-label="Case study outcomes">
        <Field label="Outcomes eyebrow"><input name="outcome_eyebrow" defaultValue={study.outcome_eyebrow || "OUTCOMES"} className={adminStyles.input} /></Field>
        <Field label="Outcomes title"><input name="outcome_title" defaultValue={study.outcome_title} className={adminStyles.input} /></Field>
        <div className={adminStyles.field}><span className="label-small" style={{ color: "var(--text-secondary)" }}>Metrics (up to 6)</span>{Array.from({ length: 6 }, (_, i) => { const metric = metrics[i]; return <div key={i} className={styles.metricRow}><input name={`metric_${i + 1}_value`} defaultValue={metric?.value} placeholder="40+" className={adminStyles.input} /><input name={`metric_${i + 1}_label`} defaultValue={metric?.label} placeholder="Reusable components" className={adminStyles.input} /></div>; })}</div>
      </section>

      <section id="case-study-panel-overview" role="tabpanel" aria-labelledby="case-study-tab-overview" hidden={tab !== "overview"} className={styles.panel} aria-label="Overview">
        <div className={styles.sectionIntro}><span className="label-eyebrow">Overview</span><p className="body-default">Give readers a concise summary. The overview is hidden when the title and all three descriptions are empty.</p></div>
        <Field label="Eyebrow"><input name="overview_eyebrow" defaultValue={overview.eyebrow} className={adminStyles.input} /></Field>
        <Field label="Overview title"><textarea name="overview_title" defaultValue={overview.title} className={adminStyles.textarea} rows={2} /></Field>
        <Field label="The situation"><textarea name="overview_situation" defaultValue={overview.situation} className={adminStyles.textarea} rows={4} /></Field>
        <Field label="What I did"><textarea name="overview_contribution" defaultValue={overview.contribution} className={adminStyles.textarea} rows={4} /></Field>
        <Field label="What changed"><textarea name="overview_change" defaultValue={overview.change} className={adminStyles.textarea} rows={4} /></Field>
        <label className={adminStyles.checkboxField}><input type="checkbox" name="overview_public" role="switch" defaultChecked={overview.publicWhenProtected} /><span className={adminStyles.switch} aria-hidden="true" /><span>Show overview without a password</span></label>
        <p className="body-small">When off, the overview is visible only after a protected case study is unlocked. Unprotected case studies show it normally.</p>
      </section>

      <section id="case-study-panel-assessment" role="tabpanel" aria-labelledby="case-study-tab-assessment" hidden={tab !== "assessment"} className={styles.panel} aria-label="Assessment">
        <div className={styles.sectionIntro}><span className="label-eyebrow">Assessment</span><p className="body-default">Record the complexity you observed, what the assessment suggests, and what was actually conducted.</p></div>
        <p className="body-small">Insert the assessment from the content editor toolbar to choose where it appears in the case study.</p>
        <div className={styles.assessmentGrid}>
          <div><h2 className="heading-03">Complexity scores</h2>{assessmentCriteriaList.map((criterion) => { const selectedScore = Number(scores[criterion.key]); const selectedLevel = selectedScore >= 1 && selectedScore <= 5 ? criterion.levels[selectedScore as 1 | 2 | 3 | 4 | 5] : undefined; return <div className={styles.scoreRow} key={criterion.key}><div><strong>{criterion.label}{primaryDrivers.includes(criterion.key) && <span className={styles.driverBadge}>Primary driver</span>}</strong><small>{criterion.question}</small><input type="hidden" name={`assessment_score_${criterion.key}`} value={scores[criterion.key]} /></div><div className={styles.scoreControl}><div className={styles.segmented} role="group" aria-label={`${criterion.label} score`}>{([1, 2, 3, 4, 5] as const).map((score) => <button key={score} type="button" className={scores[criterion.key] === String(score) ? styles.segmentActive : styles.segment} aria-pressed={scores[criterion.key] === String(score)} onClick={() => setScores((current) => ({ ...current, [criterion.key]: String(score) }))}><span>{score}</span><small>{criterion.levels[score].label}</small></button>)}</div>{selectedLevel && <p className={styles.scoreDescription}>{selectedLevel.description}</p>}</div></div>; })}</div>
          <div><h2 className="heading-03">Overall complexity</h2><input type="hidden" name="assessment_overall" value={overallLabel} /><p className="body-small">A default is selected from the completed scores. You can choose another label without changing the scores.</p><div className={styles.overallOptions} role="group" aria-label="Overall complexity">{overallOptions.map((label) => <button key={label} type="button" className={overallLabel === label ? styles.overallOptionActive : styles.overallOption} aria-pressed={overallLabel === label} onClick={() => setOverallOverride(label)}><strong>{label}</strong><small>{overallDescriptions[label]}</small></button>)}</div><Field label="Additional details"><textarea name="assessment_overall_description" defaultValue={assessment.overallDescription} placeholder="What makes this engagement complex?" className={adminStyles.textarea} /></Field></div>
        </div>
        <div className={styles.engagement}>
          <div className={styles.engagementHeader}><div><h2 className="heading-03">Engagement activities</h2><p className="body-small">Create categories and add the activities that describe the work.</p></div></div>
          <input type="hidden" name="assessment_activity_categories" value={JSON.stringify(activityCategories)} />
          {activityCategories.map((category) => {
            const activities = category.activities;
            return <section className={styles.activityGroup} key={category.id}>
              <div className={styles.activityGroupHeader}>{activeCategoryEdit === category.id ? <input autoFocus className={adminStyles.input} value={category.title} onChange={(event) => setActivityCategories((current) => current.map((group) => group.id === category.id ? { ...group, title: event.target.value } : group))} onBlur={(event) => { const next = activityCategories.map((group) => group.id === category.id ? { ...group, title: event.currentTarget.value } : group); setActivityCategories(next); setActiveCategoryEdit(null); if (event.currentTarget.value.trim()) void saveActivityCategories(next); }} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); event.currentTarget.blur(); } if (event.key === "Escape") setActiveCategoryEdit(null); }} placeholder="Category name" aria-label="Category name" /> : <button type="button" className={styles.editableCategoryTitle} onClick={() => setActiveCategoryEdit(category.id)} aria-label={`Edit category: ${category.title || "untitled"}`}>{category.title || "Add category name"}</button>}<button type="button" className={adminStyles.tertiaryButton} onClick={() => setActivityCategories((current) => current.filter((group) => group.id !== category.id))} aria-label={`Remove category ${category.title || "untitled"}`}>Remove category</button></div>
              {activities.length === 0 && <p className={styles.engagementEmpty}>No engagements in this section yet.</p>}
              <div className={styles.editableEngagementList}>{activities.map((activity) => {
                return <article className={`${styles.editableEngagement} ${styles.activityCard}`} key={activity.id}>
                  <button type="button" className={styles.removeEngagementButton} onClick={() => removeEngagement(category.id, activity.id)} aria-label={`Remove ${activity.title || "engagement"}`} title="Remove engagement">
                    <AdminIcon name="action-delete" />
                  </button>
                  <div className={styles.editableEngagementFields}>
                    <div className={styles.activityStatusOptions} role="group" aria-label={`Status for ${activity.title || "engagement"}`}>{([ ["completed", "Completed"], ["not_completed", "Incomplete"], ["not_started", "Not started"] ] as const).map(([value, label]) => <button type="button" key={value} className={activity.status === value ? filterStyles.filterActive : filterStyles.filter} data-status={value} aria-pressed={activity.status === value} onClick={() => updateEngagement(category.id, activity.id, { status: value })}>{label}</button>)}</div>
                    <div className={styles.inlineEngagementField}>
                      {activeEngagementEdit === `${activity.id}:title`
                        ? <input autoFocus aria-label="Engagement title" value={activity.title} onChange={(event) => updateEngagement(category.id, activity.id, { title: event.target.value })} onBlur={(event) => void saveEngagementOnBlur(category.id, activity.id, "title", event.currentTarget.value)} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); if (event.key === "Escape") setActiveEngagementEdit(null); }} placeholder="Engagement title" className={`${adminStyles.input} ${styles.inlineEngagementInput}`} />
                        : <button type="button" className={styles.inlineEngagementTitle} onClick={() => setActiveEngagementEdit(`${activity.id}:title`)} aria-label={`Edit title: ${activity.title || "Engagement"}`}>{activity.title || <span className={styles.inlineEngagementPlaceholder}>Add engagement title</span>}</button>}
                    </div>
                    <div className={styles.inlineEngagementField}>
                      {activeEngagementEdit === `${activity.id}:description`
                        ? <textarea autoFocus aria-label="Engagement description" value={activity.description} onChange={(event) => updateEngagement(category.id, activity.id, { description: event.target.value })} onBlur={(event) => void saveEngagementOnBlur(category.id, activity.id, "description", event.currentTarget.value)} onKeyDown={(event) => { if (event.key === "Escape") setActiveEngagementEdit(null); }} placeholder="What this engagement involves" className={`${adminStyles.textarea} ${styles.inlineEngagementTextarea}`} />
                        : <button type="button" className={styles.inlineEngagementDescription} onClick={() => setActiveEngagementEdit(`${activity.id}:description`)} aria-label={`Edit description for ${activity.title || "engagement"}`}>{activity.description || <span className={styles.inlineEngagementPlaceholder}>Add a description</span>}</button>}
                    </div>
                  </div>
                </article>;
              })}</div>
              <button type="button" className={styles.addEngagementButton} onClick={() => addEngagement(category.id)}>+ Add engagement</button>
            </section>;
          })}
          <button type="button" className={styles.addEngagementButton} onClick={() => { const id = crypto.randomUUID(); setActivityCategories((current) => [...current, { id, title: "", activities: [] }]); setActiveCategoryEdit(id); }}>+ Add category</button>
        </div>
      </section>

      <section id="case-study-panel-content" role="tabpanel" aria-labelledby="case-study-tab-content" hidden={tab !== "content"} className={styles.panel} aria-label="Case study content">
        <p className="body-small">Save keeps your working body in the admin. Publish updates the live body unless Draft is switched on.</p>
        <div className={`${adminStyles.field} ${adminStyles.fieldWide}`}><span className="label-small" style={{ color: "var(--text-secondary)" }}>Body</span><RichTextEditor key={bodyEditorKey} name="body" defaultValue={bodyValue} allowAssessment onContentChange={(html) => { setBodyValue(html); markUnsaved(); }} relatedReadings={relatedReadings} toolbarAddon={<><label className={styles.bodyDraftSwitch}><input type="checkbox" name="body_draft_enabled" checked={bodyDraftEnabled} onChange={(event) => setBodyDraftEnabled(event.target.checked)} /><span aria-hidden="true" /><strong>Draft</strong></label>{bodyDiffersFromLive && <button type="button" className={styles.discardBodyDraft} onClick={() => void discardBodyDraft()}>Discard body draft</button>}</>} /></div>
      </section>

      <section id="case-study-panel-metadata" role="tabpanel" aria-labelledby="case-study-tab-metadata" hidden={tab !== "metadata"} className={styles.panel} aria-label="Case study metadata and SEO">
        <div className={styles.sectionIntro}><span className="label-eyebrow">Metadata and SEO</span><p className="body-default">Control how this case study appears in search results and when it is shared.</p></div>
        <MetadataFields values={study} />
      </section>

      <section id="case-study-panel-visibility" role="tabpanel" aria-labelledby="case-study-tab-visibility" hidden={tab !== "visibility"} className={styles.panel} aria-label="Case study visibility">
        <div className={styles.sectionIntro}><span className="label-eyebrow">Visibility</span><p className="body-default">Control what visitors can see while you develop and publish this case study.</p></div>
        <label className={styles.visibilitySwitch}><span><strong>In progress</strong><small>Keep the introduction and outcomes live, while replacing the assessment and full write-up with an In Progress message.</small></span><input type="checkbox" name="in_progress" defaultChecked={Boolean(study.in_progress)} /><span aria-hidden="true" /></label>
        <label className={styles.visibilitySwitch}><span><strong>Password required</strong><small>When enabled, visitors can see the hero and outcomes, but must enter a password to read the case study.</small></span><input type="checkbox" name="password_required" defaultChecked={passwordRequired} /><span aria-hidden="true" /></label>
        <div className={styles.passwordManager}><div className={styles.passwordManagerHeader}><div><h2 className="heading-03">Accepted passwords</h2><p className="body-small">{savedPasswords.length - removedPasswords.length} active {savedPasswords.length - removedPasswords.length === 1 ? "password" : "passwords"}. Save to apply changes.</p></div></div><PasswordManager studyId={study.id} passwordEntries={savedPasswords} pending={pendingPasswords} setPending={setPendingPasswords} removed={removedPasswords} setRemoved={setRemovedPasswords} disabled={saveState === "saving"} onCommit={markUnsaved} /></div>
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
          <div className={styles.mediaHeading}><h2 className="heading-03">Media</h2><button type="button" className={adminStyles.secondaryButton} onClick={() => setHeroCodeOpen(true)}>{heroCode.trim() ? "Edit code" : "Add code"}</button></div>
          {heroCode.trim() && <small>The interactive visual uses the cover image area. Add a cover image for the visual to appear and to provide a fallback for reduced motion or errors. Save and publish to update the live case study.</small>}
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
      {heroCodeOpen && <HeroCodeDialog initialCode={heroCode} onCancel={() => setHeroCodeOpen(false)} onSave={(code) => { setHeroCode(code); setHeroCodeOpen(false); markUnsaved(); }} />}
    </form>
  );
}

function subscribeMotion(update: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", update);
  return () => media.removeEventListener("change", update);
}

function HeroCodeDialog({ initialCode, onCancel, onSave }: { initialCode: string; onCancel: () => void; onSave: (code: string) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [code, setCode] = useState(initialCode);
  const reducedMotion = useSyncExternalStore(subscribeMotion, () => window.matchMedia("(prefers-reduced-motion: reduce)").matches, () => true);
  useEffect(() => { if (dialog.current && !dialog.current.open) dialog.current.showModal(); }, []);
  return <dialog ref={dialog} className={styles.heroCodeDialog} aria-labelledby="hero-code-title" onCancel={(event) => { event.preventDefault(); onCancel(); }}>
    <div className={styles.heroCodeDialogHeader}><h2 id="hero-code-title" className="heading-03">Interactive hero visual</h2><button type="button" className={adminStyles.tertiaryButton} onClick={onCancel}>Close</button></div>
    <p className="body-small">Add a React component using TSX. It appears in the cover image area; the image remains the fallback for reduced motion or errors. External imports are not supported.</p>
    <label className={adminStyles.field}><span className="label-small">TSX code</span><textarea className={`${adminStyles.textarea} ${styles.heroCodeInput}`} value={code} onChange={(event) => setCode(event.target.value)} maxLength={100000} rows={12} placeholder={"function HeroVisual() {\n  return <div>Your interactive visual</div>;\n}"} /></label>
    {code.trim() && <div className={styles.heroCodePreview}><p className="label-small">Live preview</p>{reducedMotion ? <p className="body-small">Preview is paused because reduced motion is enabled. Visitors with this preference see the cover image.</p> : <div className={styles.heroCodeCanvas}><LiveComponentBlock code={code} runtime="react" chrome="minimal" fill /></div>}</div>}
    <div className={styles.heroCodeActions}>{initialCode.trim() && <button type="button" className={adminStyles.tertiaryButton} onClick={() => onSave("")}>Remove code</button>}<button type="button" className={adminStyles.tertiaryButton} onClick={onCancel}>Cancel</button><button type="button" className={adminStyles.submit} onClick={() => onSave(code)}>Save code</button></div>
  </dialog>;
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className={adminStyles.field}><span className="label-small" style={{ color: "var(--text-secondary)" }}>{label}</span>{children}</label>; }

function CategoryCards({ categories, selectedIds }: { categories: CategoryOption[]; selectedIds: number[] }) {
  const [selected, setSelected] = useState(selectedIds);
  return <div className={adminStyles.field}><span className="label-small" style={{ color: "var(--text-secondary)" }}>Categories</span><input type="hidden" name="categories_present" value="1" />{selected.map((id) => <input key={id} type="hidden" name="category_ids" value={id} />)}<div className={styles.categoryCards} role="group" aria-label="Case study categories">{categories.map((category) => <button key={category.id} type="button" className={selected.includes(category.id) ? styles.categoryCardActive : styles.categoryCard} aria-pressed={selected.includes(category.id)} onClick={() => setSelected((current) => current.includes(category.id) ? current.filter((id) => id !== category.id) : [...current, category.id])}><strong>{category.name}</strong></button>)}</div><p className="body-small">Select all that apply. The first selected category is shown as the primary label. <Link href="/admin/categories">Manage categories</Link></p></div>;
}

function TagEditor({ initialValue, existingTags, onCommit }: { initialValue: string; existingTags: string[]; onCommit: () => void }) {
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
  return <div className={adminStyles.field}><span className="label-small" style={{ color: "var(--text-secondary)" }}>Tags</span><input type="hidden" name="tags" value={tags.join(" · ")} /><div className={styles.tagComposer}><input aria-label="Add tags" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTags(); } }} placeholder="Add one tag or paste several separated by commas" className={adminStyles.input} /><button type="button" className={styles.addTagButton} onClick={addTags}>Add tags</button></div><TagSuggestions draft={draft} existingTags={existingTags} selectedTags={tags} onSelect={(tag) => { setTags((current) => [...current, tag]); setDraft(""); onCommit(); }} /><div className={styles.tagList} aria-label="Added tags">{tags.map((tag) => <span className={styles.tag} key={tag}>{tag}<button type="button" aria-label={`Remove ${tag}`} onClick={() => removeTag(tag)}><AdminIcon name="action-close" /></button></span>)}</div><small className={styles.tagHint}>Only tags shown here are published. Separate multiple tags with commas, semicolons, or new lines.</small></div>;
}

function PasswordManager({ studyId, passwordEntries, pending, setPending, removed, setRemoved, disabled, onCommit }: { studyId: number; passwordEntries: PasswordEntry[]; pending: Array<{ name: string; password: string }>; setPending: React.Dispatch<React.SetStateAction<Array<{ name: string; password: string }>>>; removed: number[]; setRemoved: React.Dispatch<React.SetStateAction<number[]>>; disabled: boolean; onCommit: () => void }) {
  const [draft, setDraft] = useState("");
  const [draftName, setDraftName] = useState("");
  const [showDraft, setShowDraft] = useState(false);
  const [revealed, setRevealed] = useState<Record<number, string>>({});
  const [revealedPending, setRevealedPending] = useState<string[]>([]);
  const [revealError, setRevealError] = useState("");
  const addPasswords = () => { const incoming = draft.split(/[,;\n|]+/).map((password) => password.trim()).filter(Boolean); if (!incoming.length) return; const name = draftName.trim() || "Unnamed guest"; setPending((current) => [...current, ...incoming.filter((password) => !current.some((item) => item.password === password)).map((password) => ({ name, password }))]); setDraft(""); setDraftName(""); onCommit(); };
  const removePending = (password: string) => { setPending((current) => current.filter((item) => item.password !== password)); onCommit(); };
  const removeExisting = (index: number) => { setRemoved((current) => [...current, index]); onCommit(); };
  const toggleReveal = async (index: number) => {
    if (revealed[index] !== undefined) { setRevealed((current) => { const next = { ...current }; delete next[index]; return next; }); return; }
    setRevealError("");
    try {
      const response = await fetch(`/api/admin/case-studies/${studyId}/password-reveal`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ index }), cache: "no-store" });
      const result = await response.json() as { password?: string; error?: string };
      if (!response.ok || typeof result.password !== "string") throw new Error(result.error || "Password could not be revealed.");
      setRevealed((current) => ({ ...current, [index]: result.password! }));
    } catch (error) { setRevealError(error instanceof Error ? error.message : "Password could not be revealed."); }
  };
  return <fieldset className={styles.passwordFields} disabled={disabled}>
    <input type="hidden" name="password_add" value={JSON.stringify(pending)} />{removed.map((index) => <input type="hidden" name="password_remove" value={index} key={index} />)}
    {(passwordEntries.length > removed.length || pending.length > 0) && <div className={styles.passwordCards} aria-label="Accepted and pending passwords">
      {passwordEntries.map((entry, index) => !removed.includes(index) && <div className={styles.passwordCard} key={`${entry.name}-${index}`}><div><strong>{entry.name}</strong><span>{revealed[index] ?? entry.masked}</span>{!entry.revealable && <small>Saved before reveal was available; replace to reveal.</small>}</div><div className={styles.passwordCardActions}>{entry.revealable && <button type="button" aria-label={`${revealed[index] !== undefined ? "Hide" : "Reveal"} password for ${entry.name}`} onClick={() => void toggleReveal(index)}>{revealed[index] !== undefined ? "Hide" : "Reveal"}</button>}<button type="button" aria-label={`Remove password for ${entry.name}`} onClick={() => { setRevealed({}); removeExisting(index); }}>Remove</button></div></div>)}
      {pending.map((entry) => <div className={styles.passwordCard} key={entry.password}><div><strong>{entry.name} · Unsaved</strong><span>{revealedPending.includes(entry.password) ? entry.password : "••••••••"}</span></div><div className={styles.passwordCardActions}><button type="button" onClick={() => setRevealedPending((current) => current.includes(entry.password) ? current.filter((value) => value !== entry.password) : [...current, entry.password])}>{revealedPending.includes(entry.password) ? "Hide" : "Reveal"}</button><button type="button" aria-label={`Remove pending password for ${entry.name}`} onClick={() => removePending(entry.password)}>Remove</button></div></div>)}
    </div>}
    {revealError && <p className={styles.passwordError} role="alert">{revealError}</p>}
    <div className={styles.passwordComposer}><input type="text" value={draftName} onChange={(event) => setDraftName(event.target.value)} placeholder="Name or person" className={adminStyles.input} /><div className={styles.passwordInput}><input type={showDraft ? "text" : "password"} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addPasswords(); } }} placeholder="Enter a password" className={adminStyles.input} autoComplete="new-password" /><button type="button" onClick={() => setShowDraft((current) => !current)} aria-label={`${showDraft ? "Hide" : "Reveal"} new password`}>{showDraft ? "Hide" : "Reveal"}</button></div><button type="button" className={styles.addTagButton} onClick={addPasswords}>Add password</button></div>
    <small className={styles.tagHint}>New passwords can be revealed after saving. Older passwords cannot be recovered; replace them if needed.</small>
  </fieldset>;
}
