"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type CSSProperties } from "react";
import Image from "next/image";
import { Logo } from "@/components/Logo/Logo";
import { PersonalLogoMark } from "@/components/Logo/PersonalLogoMark";
import { DEFAULT_PALETTE_ANCHORS, generateThemePalette, isHexColor, resolveTheme, THEME_TONES, type PaletteAnchors, type ThemeTone } from "@/lib/themePalette";
import adminStyles from "@/app/admin/(dashboard)/admin.module.css";
import styles from "./SiteIdentityEditor.module.css";

type ThemeColors = {
  theme_primary_500: string;
  theme_secondary_500: string;
  theme_accent_500: string;
  theme_neutral_500: string;
};

type Role = keyof ThemeColors;

const ROLES: Array<{ key: Role; palette: keyof PaletteAnchors; label: string; usage: string }> = [
  { key: "theme_primary_500", palette: "primary", label: "Primary", usage: "Primary action fills, plus secondary button hover and pressed states." },
  { key: "theme_secondary_500", palette: "secondary", label: "Secondary", usage: "Secondary action labels and outlines, plus supporting system accents." },
  { key: "theme_accent_500", palette: "accent", label: "Accent", usage: "Primary button hover and pressed states, links and focus indicators." },
  { key: "theme_neutral_500", palette: "neutral", label: "Neutral", usage: "Page and panel backgrounds, text, borders and form fields." },
];

function UploadIcon() {
  return <span className={styles.uploadIcon} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4m-4 4 4-4 4 4" /><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></svg></span>;
}

function resolveAnchors(colors: ThemeColors): PaletteAnchors {
  return {
    primary: colors.theme_primary_500,
    secondary: colors.theme_secondary_500,
    accent: colors.theme_accent_500,
    neutral: colors.theme_neutral_500,
  };
}

export function SiteIdentityEditor({
  logoImage,
  logoIconImage,
  logoIdentity,
  colors: initialColors,
  saved,
  error,
}: {
  logoImage: string;
  logoIconImage: string;
  logoIdentity: "business" | "personal";
  colors: ThemeColors;
  saved: string;
  error?: string;
}) {
  const [colors, setColors] = useState(initialColors);
  const [logoPreview, setLogoPreview] = useState(logoImage);
  const [iconPreview, setIconPreview] = useState(logoIconImage);
  const [logoObjectUrl, setLogoObjectUrl] = useState("");
  const [iconObjectUrl, setIconObjectUrl] = useState("");
  const [removeLogo, setRemoveLogo] = useState(false);
  const [removeIcon, setRemoveIcon] = useState(false);
  const colorsValid = ROLES.every(({ key }) => isHexColor(colors[key]));
  const resolution = useMemo(() => colorsValid ? resolveTheme(resolveAnchors(colors)) : null, [colors, colorsValid]);

  useEffect(() => () => {
    if (logoObjectUrl) URL.revokeObjectURL(logoObjectUrl);
    if (iconObjectUrl) URL.revokeObjectURL(iconObjectUrl);
  }, [logoObjectUrl, iconObjectUrl]);

  function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (logoObjectUrl) URL.revokeObjectURL(logoObjectUrl);
    if (file) {
      const nextUrl = URL.createObjectURL(file);
      setLogoObjectUrl(nextUrl);
      setLogoPreview(nextUrl);
      setRemoveLogo(false);
    } else {
      setLogoObjectUrl("");
      setLogoPreview(logoImage);
    }
  }

  function handleIconChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (iconObjectUrl) URL.revokeObjectURL(iconObjectUrl);
    if (file) {
      const nextUrl = URL.createObjectURL(file);
      setIconObjectUrl(nextUrl);
      setIconPreview(nextUrl);
      setRemoveIcon(false);
    } else {
      setIconObjectUrl("");
      setIconPreview(logoIconImage);
    }
  }

  function updateColor(key: Role, value: string) {
    setColors((current) => ({ ...current, [key]: value }));
  }

  return <div className={adminStyles.form}>
    {saved && <p className={styles.statusSuccess} role="status">{saved === "branding" ? "Branding saved." : saved === "reset" ? "The original site theme has been restored." : "Theme published."}</p>}
    {error && <p className={styles.statusError} role="alert">{error}</p>}

    <div className={styles.identityLayout}>
      <div className={styles.controlsColumn}>
        <form action="/api/admin/site-identity" method="POST" encType="multipart/form-data">
          <input type="hidden" name="form_type" value="branding" />
          <section className={`${adminStyles.panel} ${styles.identityPanel}`} aria-labelledby="identity-branding">
            <div className={styles.sectionHeading}>
              <div><p className="label-eyebrow">BRANDING</p><h2 id="identity-branding" className="heading-03">Site logos</h2></div>
              <p className="body-small">Set a full logo for the header and footer, and a separate icon for the favicon. The built-in {logoIdentity === "business" ? "ConScept" : "Andrei Stanescu"} identity stays in place until you upload replacements.</p>
            </div>
            <div className={styles.brandingGrid}>
              <div className={styles.logoVariant}>
                <span className={styles.logoVariantLabel}>Full logo</span>
                <label className={`${styles.logoPreview} ${styles.fullLogoPreview}`}>
                  {logoPreview && !removeLogo ? <Image src={logoPreview} alt="Full logo preview" width={340} height={100} unoptimized /> : <Logo variant="primary" identity={logoIdentity} />}
                  <input className={styles.logoUpload} type="file" name="logo_image" accept=".png,.svg,image/png,image/svg+xml" onChange={handleLogoChange} aria-label="Upload full logo" aria-describedby="full-logo-help" />
                  <UploadIcon />
                </label>
                <span id="full-logo-help" className="body-small">PNG or SVG, up to 8 MB.</span>
                {logoImage && <label className={styles.removeLogo}><input type="checkbox" name="remove_logo" checked={removeLogo} onChange={(event) => setRemoveLogo(event.target.checked)} /><span>Use the built-in full logo</span></label>}
              </div>
              <div className={styles.logoVariant}>
                <span className={styles.logoVariantLabel}>Icon only · favicon</span>
                <label className={`${styles.logoPreview} ${styles.iconLogoPreview}`}>
                  {iconPreview && !removeIcon ? <Image src={iconPreview} alt="Icon-only logo preview" width={72} height={72} unoptimized /> : logoIdentity === "personal" ? <PersonalLogoMark size={64} /> : <Image src="/assets/logo-icon-nav.svg" alt="" width={64} height={64} unoptimized />}
                  <input className={styles.logoUpload} type="file" name="logo_icon_image" accept=".png,.svg,image/png,image/svg+xml" onChange={handleIconChange} aria-label="Upload icon" aria-describedby="icon-logo-help" />
                  <UploadIcon />
                </label>
                <span id="icon-logo-help" className="body-small">PNG or SVG, up to 8 MB. This also becomes the browser favicon.</span>
                {logoIconImage && <label className={styles.removeLogo}><input type="checkbox" name="remove_logo_icon" checked={removeIcon} onChange={(event) => setRemoveIcon(event.target.checked)} /><span>Use the built-in icon</span></label>}
              </div>
            </div>
            <div className={adminStyles.formActions}>
              <button type="submit" className={adminStyles.submit}><span className="label-button">Save branding</span></button>
            </div>
          </section>
        </form>

        <form action="/api/admin/site-identity" method="POST">
          <input type="hidden" name="form_type" value="theme" />
          <section className={`${adminStyles.panel} ${styles.themePanel}`} aria-labelledby="identity-theme">
            <div className={styles.sectionHeading}>
              <div><p className="label-eyebrow">THEME</p><h2 id="identity-theme" className="heading-03">Brand colour palettes</h2></div>
              <p className="body-small">Set one exact 500 anchor per palette. Its OKLCH tonal scale and accessible semantic colours are previewed alongside the controls.</p>
            </div>
            <div className={styles.colorRoles}>
              {ROLES.map(({ key, palette: paletteRole, label, usage }) => {
                const valid = isHexColor(colors[key]);
                const seed = valid ? colors[key] : isHexColor(initialColors[key]) ? initialColors[key] : DEFAULT_PALETTE_ANCHORS[paletteRole];
                const palette = generateThemePalette(seed);
                return <fieldset className={styles.colorRole} key={key}>
                  <legend>{label}</legend>
                  <p className={styles.roleUsage}>{usage}</p>
                  <div className={styles.colorInputRow}>
                    <input type="color" aria-label={`${label} color picker`} value={valid ? colors[key] : initialColors[key]} onChange={(event) => updateColor(key, event.target.value.toUpperCase())} />
                    <label><span className="label-small">{label} 500</span><input type="text" name={key} value={colors[key]} onChange={(event) => updateColor(key, event.target.value)} pattern="#[\da-fA-F]{6}" maxLength={7} required aria-label={`${label} 500 hex code`} className={adminStyles.input} /></label>
                  </div>
                  {!valid && <small className={styles.colorError}>Use a six-digit hex code, such as #E8441C.</small>}
                  <div className={styles.palette} aria-label={`${label} generated color tones`}>
                    {THEME_TONES.map((tone: ThemeTone) => <div className={styles.tone} key={tone} title={`${label} ${tone}: ${palette[tone]}`}><span style={{ backgroundColor: palette[tone] }} /><small>{tone}</small></div>)}
                  </div>
                </fieldset>;
              })}
            </div>

            {resolution && <section className={styles.validation} aria-labelledby="theme-validation">
              <h3 id="theme-validation" className="heading-04">Contrast review</h3>
              {resolution.issues.length ? <ul className={styles.issueList} role="alert">{resolution.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul> : <p className="body-small">Required text, action and focus contrast checks pass for light and dark themes.</p>}
            </section>}

            <div className={adminStyles.formActions}>
              <button type="button" className={adminStyles.tertiaryButton} onClick={() => setColors(initialColors)}>Discard draft</button>
              <button type="submit" name="theme_action" value="reset" formNoValidate className={adminStyles.tertiaryButton} onClick={(event) => { if (!window.confirm("Restore the original site theme? This will replace the currently published colors.")) event.preventDefault(); }}>Restore original site theme</button>
              <button type="submit" name="theme_action" value="publish" className={adminStyles.submit} disabled={!resolution || resolution.issues.length > 0}><span className="label-button">Publish theme</span></button>
            </div>
          </section>
        </form>
      </div>

      {resolution && <aside className={`${adminStyles.panel} ${styles.previewPanel}`} aria-labelledby="theme-preview-title">
        <div className={styles.previewHeading}><h2 id="theme-preview-title" className="heading-03">Draft interface preview</h2><p className="body-small">Hover over either button to see its interactive state. This preview is local to this page; the public theme changes only when a valid theme is published.</p></div>
        <div className={styles.previewModes}>
          {(["light", "dark"] as const).map((mode) => {
            const tokens = resolution.semantic[mode];
            const style = { backgroundColor: tokens["--bg-canvas"], color: tokens["--text-primary"] } as CSSProperties;
            const primaryStyle = {
              "--preview-bg": tokens["--action-primary-bg"],
              "--preview-hover-bg": tokens["--action-primary-hover"],
              "--preview-pressed-bg": tokens["--action-primary-pressed"],
              "--preview-text": tokens["--action-primary-text"],
              "--preview-hover-text": tokens["--action-primary-hover-text"],
              "--preview-pressed-text": tokens["--action-primary-pressed-text"],
            } as CSSProperties;
            const secondaryStyle = {
              "--preview-bg": tokens["--action-secondary-bg"],
              "--preview-hover-bg": tokens["--action-secondary-hover"],
              "--preview-pressed-bg": tokens["--action-secondary-pressed"],
              "--preview-text": tokens["--action-secondary-text"],
              "--preview-hover-text": tokens["--action-secondary-hover-text"],
              "--preview-pressed-text": tokens["--action-secondary-pressed-text"],
              "--preview-border": tokens["--action-secondary-border"],
              "--preview-hover-border": tokens["--action-secondary-hover-border"],
              "--preview-pressed-border": tokens["--action-secondary-pressed-border"],
            } as CSSProperties;
            return <div className={`${styles.previewMode} ${mode === "dark" ? styles.previewDark : ""}`} key={mode} style={style}>
              <span className={styles.modeLabel}>{mode} theme</span>
              <div className={styles.previewCard} style={{ backgroundColor: tokens["--bg-surface"], borderColor: tokens["--border-default"] }}>
                <strong style={{ color: tokens["--text-primary"] }}>A representative content panel</strong>
                <p style={{ color: tokens["--text-secondary"] }}>Primary and secondary text sit on the same surface.</p>
                <a href="#theme-preview-title" style={{ color: tokens["--text-accent"] }}>Text link</a>
                <div className={styles.previewActions}>
                  <button type="button" className={styles.previewPrimaryButton} style={primaryStyle}>Primary action</button>
                  <button type="button" className={styles.previewSecondaryButton} style={secondaryStyle}>Secondary</button>
                </div>
                <input aria-label={`${mode} theme field preview`} value="Focused input field" readOnly style={{ backgroundColor: tokens["--bg-field"], color: tokens["--text-primary"], borderColor: tokens["--border-field"], outline: `2px solid ${tokens["--border-focus"]}`, outlineOffset: 1 }} />
                <div className={styles.previewNav} style={{ borderColor: tokens["--border-default"] }}><span>Navigation</span><span style={{ color: tokens["--text-accent"], borderColor: tokens["--border-focus"] }}>Selected item</span></div>
              </div>
            </div>;
          })}
        </div>
      </aside>}
    </div>
  </div>;
}
