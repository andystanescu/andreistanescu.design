"use client";

import { Fragment, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ChangeEvent, type CSSProperties } from "react";
import { DEFAULT_PALETTE_ANCHORS, EDITABLE_THEME_GROUPS, generateThemePalette, isHexColor, resolveTheme, THEME_TONES, type PaletteAnchors, type ThemeOverrides, type ThemeTone } from "@/lib/themePalette";
import adminStyles from "@/app/admin/(dashboard)/admin.module.css";
import styles from "./SiteIdentityEditor.module.css";
import { LogoColorEditor } from "./LogoColorEditor";

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

function subscribeToTheme(update: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const observer = new MutationObserver(update);
  observer.observe(document.documentElement, {attributes: true, attributeFilter: ["data-theme"]});
  media.addEventListener("change", update);
  return () => { observer.disconnect(); media.removeEventListener("change", update); };
}

function activeTheme(): "light" | "dark" {
  const selected = document.documentElement.dataset.theme;
  return selected === "dark" || (!selected && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
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
  logoColorMapping,
  iconColorMapping,
  colors: initialColors,
  overrides: initialOverrides,
  saved,
  error,
}: {
  logoImage: string;
  logoIconImage: string;
  logoIdentity: "business" | "personal";
  logoColorMapping: string;
  iconColorMapping: string;
  colors: ThemeColors;
  overrides?: ThemeOverrides;
  saved: string;
  error?: string;
}) {
  const [colors, setColors] = useState(initialColors);
  const [overrides, setOverrides] = useState<ThemeOverrides>(initialOverrides ?? { light: {}, dark: {} });
  const [editMode, setEditMode] = useState<"light" | "dark">("light");
  const [editorOpen, setEditorOpen] = useState(false);
  const activeMode = useSyncExternalStore<"light" | "dark">(subscribeToTheme, activeTheme, () => "light");
  const lastValidColors = useRef(initialColors);
  const [logoPreview, setLogoPreview] = useState(logoImage);
  const [iconPreview, setIconPreview] = useState(logoIconImage);
  const [logoIsSvg, setLogoIsSvg] = useState(/\.svg(?:\?|$)/i.test(logoImage));
  const [iconIsSvg, setIconIsSvg] = useState(/\.svg(?:\?|$)/i.test(logoIconImage));
  const [logoObjectUrl, setLogoObjectUrl] = useState("");
  const [iconObjectUrl, setIconObjectUrl] = useState("");
  const colorsValid = ROLES.every(({ key }) => isHexColor(colors[key]));
  const overridesValid = Object.values(overrides).every((mode) => Object.values(mode).every(isHexColor));
  const resolution = useMemo(() => colorsValid && overridesValid ? resolveTheme(resolveAnchors(colors), overrides) : null, [colors, colorsValid, overrides, overridesValid]);
  const automatic = useMemo(() => colorsValid ? resolveTheme(resolveAnchors(colors)) : null, [colors, colorsValid]);
  const publishedLogoTheme = useMemo(() => resolveTheme(resolveAnchors(initialColors), initialOverrides), [initialColors, initialOverrides]);

  function updateOverride(token: string, value?: string) {
    setOverrides((current) => {
      const next = { ...current[editMode] };
      if (value === undefined) delete next[token]; else next[token] = value;
      return { ...current, [editMode]: next };
    });
  }

  useEffect(() => () => {
    if (logoObjectUrl) URL.revokeObjectURL(logoObjectUrl);
    if (iconObjectUrl) URL.revokeObjectURL(iconObjectUrl);
  }, [logoObjectUrl, iconObjectUrl]);

  function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setLogoIsSvg(file ? file.type === "image/svg+xml" : /\.svg(?:\?|$)/i.test(logoImage));
    if (logoObjectUrl) URL.revokeObjectURL(logoObjectUrl);
    if (file) {
      const nextUrl = URL.createObjectURL(file);
      setLogoObjectUrl(nextUrl);
      setLogoPreview(nextUrl);
    } else {
      setLogoObjectUrl("");
      setLogoPreview(logoImage);
    }
  }

  function handleIconChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setIconIsSvg(file ? file.type === "image/svg+xml" : /\.svg(?:\?|$)/i.test(logoIconImage));
    if (iconObjectUrl) URL.revokeObjectURL(iconObjectUrl);
    if (file) {
      const nextUrl = URL.createObjectURL(file);
      setIconObjectUrl(nextUrl);
      setIconPreview(nextUrl);
    } else {
      setIconObjectUrl("");
      setIconPreview(logoIconImage);
    }
  }

  function updateColor(key: Role, value: string) {
    if (isHexColor(value) && isHexColor(lastValidColors.current[key])) {
      const before = generateThemePalette(lastValidColors.current[key]);
      const after = generateThemePalette(value);
      setOverrides((current) => {
        const remap = (entries: Record<string, string>) => Object.fromEntries(Object.entries(entries).map(([token, color]) => {
          if (color.toUpperCase() === "#FFFFFF" || color.toUpperCase() === "#000000") return [token, color];
          const tone = THEME_TONES.find((step) => before[step] === color.toUpperCase());
          return [token, tone === undefined ? color : after[tone]];
        }));
        return { light: remap(current.light), dark: remap(current.dark) };
      });
      lastValidColors.current = { ...lastValidColors.current, [key]: value };
    }
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
              <p className="body-small">Set a full logo for the header and footer, and a separate icon for the favicon. Upload a replacement whenever you want to change either image.</p>
            </div>
            <div className={styles.brandingGrid}>
              <LogoColorEditor label="Full logo" source={logoPreview} isSvg={logoIsSvg} savedSource={logoImage} initialMapping={logoColorMapping} palettes={publishedLogoTheme.palettes} backgrounds={{light: publishedLogoTheme.semantic.light["--bg-canvas"], dark: publishedLogoTheme.semantic.dark["--bg-canvas"]}} foregrounds={{light: publishedLogoTheme.semantic.light["--text-primary"], dark: publishedLogoTheme.semantic.dark["--text-primary"]}} field="logo_color_mapping" uploadName="logo_image" onUpload={handleLogoChange} activeMode={activeMode} identity={logoIdentity} />
              <LogoColorEditor label="Icon" source={iconPreview} isSvg={iconIsSvg} savedSource={logoIconImage} initialMapping={iconColorMapping} palettes={publishedLogoTheme.palettes} backgrounds={{light: publishedLogoTheme.semantic.light["--bg-canvas"], dark: publishedLogoTheme.semantic.dark["--bg-canvas"]}} foregrounds={{light: publishedLogoTheme.semantic.light["--text-primary"], dark: publishedLogoTheme.semantic.dark["--text-primary"]}} field="logo_icon_color_mapping" uploadName="logo_icon_image" onUpload={handleIconChange} activeMode={activeMode} identity={logoIdentity} icon />
            </div>
            <div className={adminStyles.formActions}>
              <button type="submit" className={adminStyles.submit}><span className="label-button">Save branding</span></button>
            </div>
          </section>
        </form>

        <form action="/api/admin/site-identity" method="POST">
          <input type="hidden" name="form_type" value="theme" />
          <input type="hidden" name="theme_overrides" value={JSON.stringify(overrides)} />
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
              {!overridesValid && <p className={styles.colorError} role="alert">Use a six-digit hex code for each custom colour.</p>}
              <button type="button" className={adminStyles.tertiaryButton} onClick={() => { setColors(initialColors); lastValidColors.current = initialColors; setOverrides(initialOverrides ?? { light: {}, dark: {} }); }}>Discard draft</button>
              <button type="submit" name="theme_action" value="reset" formNoValidate className={adminStyles.tertiaryButton} onClick={(event) => { if (!window.confirm("Restore the original site theme? This will replace the currently published colors.")) event.preventDefault(); }}>Restore original site theme</button>
              <button type="submit" name="theme_action" value="publish" className={adminStyles.submit} disabled={!resolution || resolution.issues.length > 0}><span className="label-button">Publish theme</span></button>
            </div>
          </section>
        </form>
      </div>

      {automatic && <aside className={`${adminStyles.panel} ${styles.previewPanel}`} aria-labelledby="theme-preview-title">
        <div className={styles.previewHeading}><h2 id="theme-preview-title" className="heading-03">Draft interface preview</h2><p className="body-small">Select a preview to fine-tune its colours. Hover over the buttons to see their interactive states. Changes stay in this draft until published.</p></div>
        <div className={`${styles.previewModes} ${editorOpen ? styles.previewModesExpanded : ""}`}>
          {(["light", "dark"] as const).map((mode) => {
            const tokens = (resolution ?? automatic).semantic[mode];
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
            return <Fragment key={mode}><div className={`${styles.previewMode} ${mode === "dark" ? styles.previewDark : ""} ${editorOpen && editMode === mode ? styles.previewSelected : ""}`} style={style} onClick={() => { setEditMode(mode); setEditorOpen(true); }}>
              <button type="button" className={styles.modeSelect} aria-pressed={editorOpen && editMode === mode} onClick={() => { setEditMode(mode); setEditorOpen(true); }}><span className={styles.modeLabel}>{mode} theme</span><span>{editorOpen && editMode === mode ? "Editing" : "Edit colours"}</span></button>
              <div className={styles.previewCard} style={{ backgroundColor: tokens["--bg-surface"], borderColor: tokens["--border-default"] }}>
                <strong style={{ color: tokens["--text-primary"] }}>A representative content panel</strong>
                <p style={{ color: tokens["--text-secondary"] }}>Primary and secondary text sit on the same surface.</p>
                <a href="#theme-preview-title" style={{ color: tokens["--action-link-text"] }}>Text link</a>
                <div className={styles.previewActions}>
                  <button type="button" className={styles.previewPrimaryButton} style={primaryStyle}>Primary action</button>
                  <button type="button" className={styles.previewSecondaryButton} style={secondaryStyle}>Secondary</button>
                </div>
                <input aria-label={`${mode} theme field preview`} value="Focused input field" readOnly style={{ backgroundColor: tokens["--bg-field"], color: tokens["--text-primary"], borderColor: tokens["--border-field"], outline: `2px solid ${tokens["--border-focus"]}`, outlineOffset: 1 }} />
                <div className={styles.previewNav} style={{ borderColor: tokens["--border-default"] }}><span>Navigation</span><span style={{ color: tokens["--text-accent"], borderColor: tokens["--border-focus"] }}>Selected item</span></div>
              </div>
            </div>
        {editorOpen && editMode === mode && <section className={styles.fineTuning} aria-label={`${mode} theme colour controls`}>
          <div className={styles.fineTuningHeader}><h3>Fine-tune interface colours</h3><button type="button" className={styles.resetToken} onClick={() => setEditorOpen(false)}>Close</button></div>
          <p className="body-small">Editing the {editMode} theme. Select colours from the generated palettes; select the other preview to edit that theme.</p>
          <button type="button" className={adminStyles.tertiaryButton} onClick={() => setOverrides((current) => ({ ...current, [editMode]: {} }))}>Reset {editMode} colours to automatic</button>
          {EDITABLE_THEME_GROUPS.map((group) => <details className={styles.tokenGroup} key={group.label}>
            <summary>{group.label}</summary>
            <div className={styles.tokenList}>{group.roles.map(([token, label]) => {
              const selected = overrides[editMode][token];
              const autoValue = automatic.semantic[editMode][token];
              const value = selected ?? autoValue;
              const inPalette = value === "#FFFFFF" || value === "#000000" || ROLES.some((role) => THEME_TONES.some((tone) => automatic.palettes[role.palette][tone] === value));
              return <div className={styles.tokenRow} key={token}>
                <div className={styles.tokenName}><span>{label}</span><code>{token}</code></div>
                <div className={styles.tokenValue}><i style={{ background: value }} /><select aria-label={`${editMode} ${group.label} ${label} palette shade`} className={adminStyles.input} value={value} onChange={(event) => updateOverride(token, event.target.value)}>{!inPalette && <option value={value}>Previously saved · {value}</option>}{ROLES.map((role) => <optgroup key={role.palette} label={role.label}>{role.palette === "neutral" && <><option value="#FFFFFF">White · #FFFFFF</option><option value="#000000">Black · #000000</option></>}{THEME_TONES.map((tone) => <option key={tone} value={automatic.palettes[role.palette][tone]}>{role.label} {tone} · {automatic.palettes[role.palette][tone]}</option>)}</optgroup>)}</select></div>
                {selected !== undefined && <button type="button" className={styles.resetToken} onClick={() => updateOverride(token)}>Reset to suggested colour</button>}
              </div>;
            })}</div>
          </details>)}
        </section>}</Fragment>;
          })}
        </div>
      </aside>}
    </div>
  </div>;
}
