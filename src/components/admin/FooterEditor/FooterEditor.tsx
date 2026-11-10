"use client";

import { useState, type KeyboardEvent } from "react";
import { Logo } from "@/components/Logo/Logo";
import styles from "@/app/admin/(dashboard)/admin.module.css";
import footerStyles from "@/components/Footer/Footer.module.css";
import previewStyles from "./FooterEditor.module.css";

type FooterDraft = { message: string; services: boolean; navigation: boolean; contact: boolean; label: string; copyright: string; contactTitle: string; contactMessage: string };
type Props = { initial: FooterDraft; logoIdentity: "personal" | "business"; logoImage: string; services: string[]; navigation: string[]; legal: string[] };

function InlineText({ label, value, onChange, multiline = false }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [original, setOriginal] = useState(value);
  function keyDown(event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
    if (event.key === "Escape") { event.preventDefault(); onChange(original); setEditing(false); }
    if (event.key === "Enter" && !multiline) { event.preventDefault(); event.currentTarget.blur(); }
  }
  const props = { "aria-label": label, value, onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(event.target.value), onBlur: () => setEditing(false), onKeyDown: keyDown, autoFocus: true, className: previewStyles.inlineInput };
  return <span className={previewStyles.inlineField}>
    <button type="button" aria-label={`Edit ${label}`} title={`Edit ${label}`} className={previewStyles.inlineText} style={editing ? { visibility: "hidden" } : undefined} tabIndex={editing ? -1 : undefined} onClick={() => { setOriginal(value); setEditing(true); }}>{value || `Add ${label.toLowerCase()}`}</button>
    {editing && (multiline ? <textarea {...props} rows={3} /> : <input {...props} type="text" />)}
  </span>;
}

export function FooterEditor({ initial, logoIdentity, logoImage, services, navigation, legal }: Props) {
  const [draft, setDraft] = useState(initial);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const field = (key: "message" | "label" | "copyright" | "contactTitle" | "contactMessage", label: string, multiline = false) => <InlineText key={key} label={label} value={draft[key]} multiline={multiline} onChange={(value) => setDraft((current) => ({ ...current, [key]: key === "copyright" ? value.replace(/^\s*©\s*/, "") : value }))} />;

  return <section id="footer-controls" className={`${styles.panel} ${previewStyles.editor}`}>
    <div className={styles.panelHeader}><h2 className="heading-02">Footer controls</h2><p className="body-small">Select text in the preview to edit it, then save your changes.</p></div>
    <div className={previewStyles.layout}>
      <form className={styles.form} action="/api/admin/footer" method="POST">
        <input type="hidden" name="footer_message" value={draft.message} /><input type="hidden" name="footer_contact_label" value={draft.label} /><input type="hidden" name="footer_copyright" value={draft.copyright} /><input type="hidden" name="footer_contact_title" value={draft.contactTitle} /><input type="hidden" name="footer_contact_message" value={draft.contactMessage} />
        {([ ["services", "Services"], ["navigation", "Navigation"], ["contact", "Contact"] ] as const).map(([key, label]) => <label className={styles.checkboxField} key={key}><input type="checkbox" name={`footer_show_${key}`} checked={draft[key]} onChange={(event) => setDraft({ ...draft, [key]: event.target.checked })} /><span className={styles.switch} aria-hidden="true" /><span className="body-default">Show {label}</span></label>)}
        <div className={styles.formActions}><button type="button" className={styles.tertiaryButton} onClick={() => setDraft(initial)}>Discard changes</button><button type="submit" className={styles.submit}>Save footer</button></div>
      </form>
      <div className={previewStyles.preview} aria-label="Footer preview">
        <div className={previewStyles.previewHeader}><p className="label-small">Live footer preview</p><div className={previewStyles.devices} aria-label="Preview size"><button type="button" aria-pressed={device === "desktop"} onClick={() => setDevice("desktop")}>Desktop</button><button type="button" aria-pressed={device === "mobile"} onClick={() => setDevice("mobile")}>Mobile</button></div></div>
        <div className={`${previewStyles.canvas} ${device === "mobile" ? previewStyles.mobileCanvas : ""}`}>
          {device === "desktop" ? <>
            <div className={footerStyles.top}>
              <div className={`${footerStyles.brand} ${previewStyles.previewBrand}`}><Logo variant="primary" theme="inverted" identity={logoIdentity} imageUrl={logoImage} /><div className="body-small">{field("message", "Message under the logo", true)}</div></div>
              <div className={`${footerStyles.linksGroup} ${previewStyles.previewLinks}`}>
                {draft.services && <div className={`${footerStyles.column} ${previewStyles.previewColumn}`}><p className="label-small">Services</p>{services.map((item, i) => <span className="body-small" key={i}>{item}</span>)}</div>}
                {draft.navigation && <div className={`${footerStyles.column} ${previewStyles.previewColumn}`}><p className="label-small">Navigation</p>{navigation.map((item, i) => <span className="body-small" key={i}>{item}</span>)}</div>}
                {draft.contact && <div className={`${footerStyles.connect} ${previewStyles.previewContact}`}><div className="label-small">{field("contactTitle", "Contact title")}</div><div className="body-small">{field("contactMessage", "Contact message", true)}</div><span className={previewStyles.previewButton}>{field("label", "Contact CTA label")} <span aria-hidden="true">→</span></span></div>}
              </div>
            </div>
            <div className={footerStyles.divider} /><div className={footerStyles.bottom}><div className={`body-small ${previewStyles.copyright}`}><span>©</span>{field("copyright", "Copyright text")}</div><div className={footerStyles.legal}>{legal.map((item) => <span className="body-small" key={item}>{item}</span>)}</div></div>
          </> : <>
            {draft.contact && <div className={footerStyles.compactPrompt}><div className="body-large">{field("contactMessage", "Contact message", true)}</div><div className={footerStyles.compactCta}>{field("label", "Contact CTA label")} <span aria-hidden="true">→</span></div></div>}
            {(draft.navigation || draft.services) && <div className={footerStyles.compactLinks}>{draft.navigation && <><span>Work</span><span>Articles</span><span>About</span></>}{draft.services && <span>Services</span>}</div>}
            <div className={`${footerStyles.compactCopyright} ${previewStyles.copyright}`}><span>©</span>{field("copyright", "Copyright text")}</div>
          </>}
        </div>
        <p className="body-small">Some pages hide the contact invitation when they already have one. The compact mobile footer does not show the logo message or contact title.</p>
      </div>
    </div>
  </section>;
}
