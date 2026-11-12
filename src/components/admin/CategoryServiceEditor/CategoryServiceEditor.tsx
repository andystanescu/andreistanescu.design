"use client";

import { useDeferredValue, useState, type ReactNode } from "react";
import Link from "next/link";
import { ImageField } from "@/components/admin/ImageField/ImageField";
import { AdminIcon } from "@/components/admin/AdminIcon/AdminIcon";
import { getServiceHeroCopy } from "@/lib/serviceHero";
import { getServiceSectionContent, parseServiceSectionOverrides, type ServiceSectionOverrides } from "@/lib/serviceSectionContent";
import { LatticeBenefitIcon } from "@/components/services/LatticeBenefitIcon/LatticeBenefitIcon";
import { ServiceRecognition } from "@/components/services/ServiceRecognition/ServiceRecognition";
import { LiveComponentBlock } from "@/components/LiveComponentBlock/LiveComponentBlock";
import { SECTION_LAYOUT_OPTIONS, canonicalSectionLayout, getServiceSectionOrder, parseServiceSectionSettings, sectionLayout, sectionVisible, type SectionLayoutKey, type ServiceSectionKey, type ServiceSectionSettings } from "@/lib/serviceSectionSettings";
import type { ServiceItem } from "@/lib/serviceItems";
import styles from "@/app/admin/(dashboard)/admin.module.css";
import cardStyles from "@/components/admin/InlineSectionCard/InlineSectionCard.module.css";
import serviceStyles from "@/app/services/[slug]/service-detail.module.css";
import filterStyles from "@/components/insights/InsightsListing/InsightsListing.module.css";
import navigationStyles from "@/components/admin/NavigationPreview/NavigationPreview.module.css";

type Category = { id: number; name: string; description: string };

export function CategoryServiceEditor({ category, service, initialTemplate }: {
  category: Category;
  service: ServiceItem | null;
  initialTemplate: string;
}) {
  const [enabled, setEnabled] = useState(Boolean(service?.service_enabled && service.published));
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description);
  const template = initialTemplate;
  const [sectionSettings, setSectionSettings] = useState<ServiceSectionSettings>(() => parseServiceSectionSettings(service?.section_settings ?? "{}"));
  const previewCode = useDeferredValue(sectionSettings.approachCode);
  const [heroLead, setHeroLead] = useState(service?.hero_lead ?? "");
  const [heroDescription, setHeroDescription] = useState(service?.hero_description ?? "");
  const [sectionOverrides, setSectionOverrides] = useState<ServiceSectionOverrides>(() => parseServiceSectionOverrides(service?.section_content ?? "{}"));
  const defaultHero = getServiceHeroCopy(template, description);
  const sectionContent = getServiceSectionContent(template, sectionOverrides);
  const outcomesLayout = sectionLayout(sectionSettings, "outcomes", template);
  const workLayout = sectionLayout(sectionSettings, "work", template);
  const recognitionLayout = sectionLayout(sectionSettings, "recognition", template);
  const setVisible = (key: ServiceSectionKey, value: boolean) => setSectionSettings((current) => ({ ...current, visibility: { ...current.visibility, [key]: value } }));
  const setLayout = (key: SectionLayoutKey, value: string) => setSectionSettings((current) => ({ ...current, layouts: { ...current.layouts, [key]: value } }));
  const sectionOrder = getServiceSectionOrder(sectionSettings, template, Boolean(service?.body));
  const moveSection = (key: ServiceSectionKey, target: number) => setSectionSettings((current) => {
    const order = getServiceSectionOrder(current, template, Boolean(service?.body));
    const from = order.indexOf(key);
    if (from < 0 || target < 0 || target >= order.length || from === target) return current;
    order.splice(target, 0, order.splice(from, 1)[0]);
    return { ...current, order };
  });
  const reorderControls = (key: ServiceSectionKey) => {
    const index = sectionOrder.indexOf(key);
    return <><button type="button" disabled={index === 0} aria-label={`Move ${key} up`} onClick={(event) => { event.preventDefault(); event.stopPropagation(); moveSection(key, index - 1); }}><AdminIcon name="direction-arrow-up" /></button><button type="button" disabled={index === sectionOrder.length - 1} aria-label={`Move ${key} down`} onClick={(event) => { event.preventDefault(); event.stopPropagation(); moveSection(key, index + 1); }}><AdminIcon name="direction-arrow-down" /></button></>;
  };
  const visibilityToggle = (key: ServiceSectionKey, label: string) => <label className={styles.checkboxField} onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
    <input type="checkbox" role="switch" aria-label={`${label} visible on site`} checked={sectionVisible(sectionSettings, key, template)} onChange={(event) => setVisible(key, event.target.checked)} /><span className={styles.switch} aria-hidden="true" /><span className="body-small">Visible on site</span>
  </label>;
  const controls = (layout: SectionLayoutKey) => <div className={styles.form} style={{ padding: "var(--space-300)" }}>
    <fieldset className={navigationStyles.styleOptions}><legend>Section layout</legend><div className={filterStyles.filters}>{SECTION_LAYOUT_OPTIONS[layout].map(([id, label]) => <button type="button" key={id} className={canonicalSectionLayout(layout, sectionLayout(sectionSettings, layout, template)) === id ? filterStyles.filterActive : filterStyles.filter} aria-pressed={canonicalSectionLayout(layout, sectionLayout(sectionSettings, layout, template)) === id} onClick={() => { if (canonicalSectionLayout(layout, sectionLayout(sectionSettings, layout, template)) !== id) setLayout(layout, id); }}>{label}</button>)}</div></fieldset>
  </div>;
  const specialSections: Array<[ServiceSectionKey, string]> = template === "design-systems" ? [["ecosystem", "Ecosystem"]] : template === "ai-enabled-design-operations" ? [["operationalLoop", "Operational loop"]] : template === "governance-scale" ? [["tension", "Governance tension"], ["changeModel", "Decision and change model"]] : template === "collaboration-alignment" ? [["alignment", "Alignment model"], ["agreement", "Alignment and agreement"]] : [];
  const updateOutcome = (index: number, field: "title" | "description", value: string) => {
    setSectionOverrides((current) => {
      const outcomes = getServiceSectionContent(template, current).outcomes.map((outcome, itemIndex) => itemIndex === index ? { ...outcome, [field]: value } : outcome);
      return { ...current, [template]: { ...current[template], outcomes } };
    });
  };
  const updateWorkItem = (index: number, value: string) => {
    setSectionOverrides((current) => {
      const workItems = getServiceSectionContent(template, current).workItems.map((item, itemIndex) => itemIndex === index ? value : item);
      return { ...current, [template]: { ...current[template], workItems } };
    });
  };
  const updateRecognitionSignal = (index: number, value: string) => {
    setSectionOverrides((current) => {
      const recognitionSignals = getServiceSectionContent(template, current).recognitionSignals.map((item, itemIndex) => itemIndex === index ? value : item);
      return { ...current, [template]: { ...current[template], recognitionSignals } };
    });
  };
    const sectionCards: Partial<Record<ServiceSectionKey, ReactNode>> = {
    additionalContent: (service?.body && <div><div className={cardStyles.card}><div className={cardStyles.summary}><span><strong className="body-default">Additional content</strong></span><span className={cardStyles.summaryActions}>{visibilityToggle("additionalContent", "Additional content")}{reorderControls("additionalContent")}</span></div></div></div>),
    outcomes: (<div><div className={cardStyles.card}><details className={cardStyles.details}>
          <summary className={cardStyles.summary}><span><strong className="body-default">Outcomes</strong></span><span className={cardStyles.summaryActions}>{visibilityToggle("outcomes", "Outcomes")}{reorderControls("outcomes")}<span className={cardStyles.expandIcon} aria-hidden="true"><AdminIcon name="action-plus" className={cardStyles.expandPlus} /><AdminIcon name="action-minus" className={cardStyles.expandMinus} /></span></span></summary>
          {controls("outcomes")}
          <div className={cardStyles.liveEditor} data-page="homepage"><div className={cardStyles.livePreview}><p className={cardStyles.previewLabel}>Live preview · Select an outcome title or description to edit.</p><div className={cardStyles.previewContent}>
            <section className={`${serviceStyles.benefits} ${["design-systems", "product-architecture", "ai-enabled-design-operations", "collaboration-alignment"].includes(outcomesLayout) ? serviceStyles.benefitsQuiet : ""} ${outcomesLayout === "ai-enabled-design-operations" ? serviceStyles.aiOperationsBenefits : ""} ${outcomesLayout === "governance-scale" ? serviceStyles.governanceOutcomes : ""} ${outcomesLayout === "collaboration-alignment" ? serviceStyles.collaborationOutcomes : ""}`}>
              <div className={`container ${serviceStyles.benefitsGrid}`}>{sectionContent.outcomes.map((outcome, index) => <article key={`${template}-${index}`} className={serviceStyles.benefit}>
                {outcomesLayout === "ai-enabled-design-operations" ? <span className={serviceStyles.aiOutcomeStage}>{template === outcomesLayout ? ["CAPACITY", "SPEED", "OVERSIGHT", "LEARNING"][index] : String(index + 1).padStart(2, "0")}</span> : ["governance-scale", "collaboration-alignment"].includes(outcomesLayout) ? null : <LatticeBenefitIcon index={index} />}
                <h2 contentEditable="plaintext-only" suppressContentEditableWarning role="textbox" aria-label={`Outcome ${index + 1} title`} onBlur={(event) => updateOutcome(index, "title", event.currentTarget.textContent?.trim() ?? "")}>{outcome.title}</h2>
                <p contentEditable="plaintext-only" suppressContentEditableWarning role="textbox" aria-label={`Outcome ${index + 1} description`} onBlur={(event) => updateOutcome(index, "description", event.currentTarget.textContent?.trim() ?? "")}>{outcome.description}</p>
              </article>)}</div>
            </section>
          </div></div></div>
        </details></div></div>),
    work: (<div><div className={cardStyles.card}><details className={cardStyles.details}>
          <summary className={cardStyles.summary}><span><strong className="body-default">What the work can involve</strong></span><span className={cardStyles.summaryActions}>{visibilityToggle("work", "What the work can involve")}{reorderControls("work")}<span className={cardStyles.expandIcon} aria-hidden="true"><AdminIcon name="action-plus" className={cardStyles.expandPlus} /><AdminIcon name="action-minus" className={cardStyles.expandMinus} /></span></span></summary>
          {controls("work")}
          <div className={cardStyles.liveEditor} data-page="homepage"><div className={cardStyles.livePreview}><p className={cardStyles.previewLabel}>Live preview · Select the heading or a work area to edit.</p><div className={cardStyles.previewContent}>
            <section className={`container ${serviceStyles.delivery} ${workLayout === "design-systems" ? serviceStyles.designSystemDelivery : ""} ${workLayout === "product-architecture" ? serviceStyles.architectureDelivery : ""} ${workLayout === "ai-enabled-design-operations" ? serviceStyles.aiOperationsDelivery : ""} ${workLayout === "governance-scale" ? serviceStyles.governanceDelivery : ""} ${workLayout === "collaboration-alignment" ? serviceStyles.collaborationDelivery : ""}`}><div className={serviceStyles.deliveryCopy}>
              <p className={`label-eyebrow ${serviceStyles.deliveryEyebrow}`}>WHAT THE WORK CAN INVOLVE</p>
              <h2 key={`work-title-${template}`} className={`heading-02 ${serviceStyles.deliveryHeading}`} contentEditable="plaintext-only" suppressContentEditableWarning role="textbox" aria-label="Work section heading" onBlur={(event) => { const value = event.currentTarget.textContent?.trim() ?? ""; setSectionOverrides((current) => ({ ...current, [template]: { ...current[template], workTitle: value } })); }}>{sectionContent.workTitle}</h2>
              <ul className={serviceStyles.deliverables}>{sectionContent.workItems.map((item, index) => <li key={`${template}-${index}`} contentEditable="plaintext-only" suppressContentEditableWarning role="textbox" aria-label={`Work area ${index + 1}`} onBlur={(event) => updateWorkItem(index, event.currentTarget.textContent?.trim() ?? "")}>{item}</li>)}</ul>
            </div></section>
          </div></div></div>
        </details></div></div>),
    ...Object.fromEntries(specialSections.map(([key, label]) => [key, <div key={key}><div className={cardStyles.card}><div className={cardStyles.summary}><span><strong className="body-default">{label}</strong></span><span className={cardStyles.summaryActions}>{visibilityToggle(key, label)}{reorderControls(key)}</span></div></div></div>])),
    approach: (<div><div className={cardStyles.card}><details className={cardStyles.details}><summary className={cardStyles.summary}><span><strong className="body-default">Approach</strong></span><span className={cardStyles.summaryActions}>{visibilityToggle("approach", "Approach")}{reorderControls("approach")}<span className={cardStyles.expandIcon} aria-hidden="true"><AdminIcon name="action-plus" className={cardStyles.expandPlus} /><AdminIcon name="action-minus" className={cardStyles.expandMinus} /></span></span></summary>
          <div className={styles.form} style={{ padding: "var(--space-300)" }}><label className={styles.field}><span className="label-small">Custom TSX</span><textarea className={`${styles.textarea} ${styles.serviceApproachCode}`} value={sectionSettings.approachCode} onChange={(event) => setSectionSettings((current) => ({ ...current, approachCode: event.target.value }))} placeholder="function Approach() { return <section>…</section>; }" rows={12} maxLength={100000} /><small>Leave empty to use the existing approach. Define a React component; React hooks are available. External imports are not supported.</small></label>{previewCode.trim() && <div style={{ width: "100%" }}><p className={cardStyles.previewLabel}>Live preview</p><LiveComponentBlock code={previewCode} runtime="react" chrome="minimal" /></div>}</div>
        </details></div></div>),
    evidence: (<div><div className={cardStyles.card}><details className={cardStyles.details}><summary className={cardStyles.summary}><span><strong className="body-default">Evidence</strong></span><span className={cardStyles.summaryActions}>{visibilityToggle("evidence", "Evidence")}{reorderControls("evidence")}<span className={cardStyles.expandIcon} aria-hidden="true"><AdminIcon name="action-plus" className={cardStyles.expandPlus} /><AdminIcon name="action-minus" className={cardStyles.expandMinus} /></span></span></summary><div className={styles.form} style={{ padding: "var(--space-300)" }}><p className="body-small">The heading uses the category name and matching published work is selected automatically.</p><label className={styles.field}><span className="label-small">Description</span><textarea className={styles.textarea} value={sectionContent.evidenceDescription} maxLength={2000} onChange={(event) => { const value = event.target.value; setSectionOverrides((current) => ({ ...current, [template]: { ...current[template], evidenceDescription: value } })); }} /></label></div></details></div></div>),
    recognition: (<div><div className={cardStyles.card}><details className={cardStyles.details}>
          <summary className={cardStyles.summary}><span><strong className="body-default">Recognition</strong></span><span className={cardStyles.summaryActions}>{visibilityToggle("recognition", "Recognition")}{reorderControls("recognition")}<span className={cardStyles.expandIcon} aria-hidden="true"><AdminIcon name="action-plus" className={cardStyles.expandPlus} /><AdminIcon name="action-minus" className={cardStyles.expandMinus} /></span></span></summary>
          {controls("recognition")}
          <div className={cardStyles.liveEditor} data-page="homepage">
            <div className={cardStyles.livePreview}><p className={cardStyles.previewLabel}>Live preview · Select the heading or a statement to edit.</p><div className={cardStyles.previewContent}><ServiceRecognition template={recognitionLayout} title={sectionContent.recognitionTitle} signals={sectionContent.recognitionSignals} onTitleChange={(value) => setSectionOverrides((current) => ({ ...current, [template]: { ...current[template], recognitionTitle: value } }))} onSignalChange={updateRecognitionSignal} /></div></div>
          </div>
        </details></div></div>),
  };
return <form className={styles.form} action={`/api/admin/categories/${category.id}`} method="POST" encType="multipart/form-data">
    <input type="hidden" name="service_editor" value="1" />
    <label className={styles.field}><span className="label-small">Category title</span><input className={styles.input} name="name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={120} /></label>
    <label className={styles.field}><span className="label-small">General description</span><textarea className={styles.textarea} name="description" value={description} onChange={(event) => setDescription(event.target.value)} /></label>
    <label className={styles.checkboxField}><input type="checkbox" role="switch" name="service_enabled" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} /><span className={styles.switch} aria-hidden="true" /><span className="body-default">Dedicated service</span></label>
    <p className="body-small">Save changes to update whether the dedicated service is published. Turning it off retains its page content.</p>
    <div className={styles.form} hidden={!enabled} style={{ display: enabled ? undefined : "none" }}>
      <label className={styles.field}><span className="label-small">Service URL slug</span><input className={styles.input} name="slug" defaultValue={service?.slug ?? ""} placeholder="Generated automatically if left empty" /><small>Used in /services/…</small></label>
      <input type="hidden" name="template_key" value={template} />
      <input type="hidden" name="hero_lead" value={heroLead} />
      <input type="hidden" name="hero_description" value={heroDescription} />
      <input type="hidden" name="section_content" value={JSON.stringify(sectionOverrides)} />
      <input type="hidden" name="section_settings" value={JSON.stringify(sectionSettings)} />
      <div className={`${styles.list} ${styles.homepageSectionList}`}><div className={styles.listItem}><div className={cardStyles.card}>
        <details className={cardStyles.details}><summary className={cardStyles.summary}><span><strong className="body-default">Hero</strong><small>fixed position</small></span><span className={cardStyles.expandIcon} aria-hidden="true"><AdminIcon name="action-plus" className={cardStyles.expandPlus} /><AdminIcon name="action-minus" className={cardStyles.expandMinus} /></span></summary>
          <div className={cardStyles.liveEditor} data-page="homepage"><div className={cardStyles.livePreview}>
            <p className={cardStyles.previewLabel}>Live preview · Select the title, proposition or supporting copy to edit.</p>
            <div className={cardStyles.previewContent}>
              <section className={`container ${serviceStyles.hero} ${template === "product-architecture" ? serviceStyles.heroArchitecture : ""}`}><div className={serviceStyles.heroCopy}>
                <span>← Back to services</span>
                <p className="label-eyebrow" style={{ color: "var(--text-accent)" }}>Services&nbsp; / &nbsp;{name}</p>
                <h1 key={`title-${template}`} className="display-small" contentEditable="plaintext-only" suppressContentEditableWarning role="textbox" aria-label="Category title" onBlur={(event) => setName(event.currentTarget.textContent?.trim() ?? "")}>{name}</h1>
                <p key={`lead-${template}`} className={`body-large ${serviceStyles.heroLead}`} contentEditable="plaintext-only" suppressContentEditableWarning role="textbox" aria-label="Hero proposition" onBlur={(event) => setHeroLead(event.currentTarget.textContent?.trim() ?? "")}>{heroLead || defaultHero.lead}</p>
                <p key={`description-${template}`} className={`body-default ${serviceStyles.heroDescription}`} contentEditable="plaintext-only" suppressContentEditableWarning role="textbox" aria-label="Hero supporting copy" onBlur={(event) => setHeroDescription(event.currentTarget.textContent?.trim() ?? "")}>{heroDescription || defaultHero.description}</p>
                <div className={serviceStyles.heroActions}><span className={serviceStyles.primaryButton}>Let&apos;s talk <span aria-hidden="true">→</span></span></div>
              </div></section>
            </div>
          </div></div>
        </details>
      </div></div></div>
      <div className={`${styles.list} ${styles.homepageSectionList}`}>
        {sectionOrder.map((key, index) => <div className={`${styles.listItem} ${styles.serviceSectionOrderItem}`} key={key} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const dragged = event.dataTransfer.getData("text/plain") as ServiceSectionKey; if (sectionOrder.includes(dragged)) moveSection(dragged, index); }}>
          <div className={styles.serviceSectionOrderActions}><button type="button" draggable className={styles.serviceSectionDragHandle} aria-label={`Drag ${key} to reorder`} title="Drag to reorder" onDragStart={(event) => event.dataTransfer.setData("text/plain", key)}>⠿</button></div>
          {sectionCards[key]}
        </div>)}
        <div className={styles.listItem}><div className={cardStyles.card}><details className={cardStyles.details}>
          <summary className={cardStyles.summary}><span><strong className="body-default">Closing call to action</strong></span><span className={cardStyles.expandIcon} aria-hidden="true"><AdminIcon name="action-plus" className={cardStyles.expandPlus} /><AdminIcon name="action-minus" className={cardStyles.expandMinus} /></span></summary>
          <div className={cardStyles.liveEditor} data-page="homepage"><div className={cardStyles.livePreview}><p className={cardStyles.previewLabel}>Live preview · Select the eyebrow, heading or description to edit.</p><div className={cardStyles.previewContent}>
            <section className={`container ${serviceStyles.recognitionCta}`}><div className={serviceStyles.recognitionCtaInner}>
              <header className={serviceStyles.recognitionCtaHeading}><p className="label-eyebrow" contentEditable="plaintext-only" suppressContentEditableWarning role="textbox" aria-label="Closing call to action eyebrow" onBlur={(event) => { const value = event.currentTarget.textContent?.trim() ?? ""; setSectionOverrides((current) => ({ ...current, [template]: { ...current[template], ctaEyebrow: value } })); }}>{sectionContent.ctaEyebrow}</p><h2 key={`cta-title-${template}`} contentEditable="plaintext-only" suppressContentEditableWarning role="textbox" aria-label="Closing call to action heading" onBlur={(event) => { const value = event.currentTarget.textContent?.trim() ?? ""; setSectionOverrides((current) => ({ ...current, [template]: { ...current[template], ctaTitle: value } })); }}>{sectionContent.ctaTitle}</h2></header>
              <div className={serviceStyles.recognitionCtaCopy}><p key={`cta-description-${template}`} contentEditable="plaintext-only" suppressContentEditableWarning role="textbox" aria-label="Closing call to action description" onBlur={(event) => { const value = event.currentTarget.textContent?.trim() ?? ""; setSectionOverrides((current) => ({ ...current, [template]: { ...current[template], ctaDescription: value } })); }}>{sectionContent.ctaDescription}</p><span className={serviceStyles.primaryButton}>Let&apos;s talk <span aria-hidden="true">→</span></span></div>
            </div></section>
          </div></div></div>
        </details></div></div>
      </div>
      <label className={styles.field}><span className="label-small">Icon</span><ImageField name="icon" currentUrl={service?.icon} /></label>
      <label className={styles.checkboxField}><input type="checkbox" name="show_on_homepage" defaultChecked={Boolean(service?.show_on_homepage)} /><span className={styles.switch} aria-hidden="true" /><span className="body-default">Show on homepage</span></label>
    </div>
    <div className={styles.formActions}><Link href="/admin/categories" className={styles.tertiaryButton}>Cancel</Link><button className={styles.submit} type="submit">Save changes</button></div>
  </form>;
}
