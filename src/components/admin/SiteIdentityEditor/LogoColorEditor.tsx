"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { extractLogoColors, emptyLogoColorMapping, parseLogoColorMapping, recolorLogoSvg, resolveLogoColor, type LogoColorMapping } from "@/lib/logoColors";
import { THEME_TONES, type PaletteRole, type ThemePalettes } from "@/lib/themePalette";
import adminStyles from "@/app/admin/(dashboard)/admin.module.css";
import styles from "./SiteIdentityEditor.module.css";

const roles: PaletteRole[] = ["primary", "secondary", "accent", "neutral"];

export function LogoColorEditor({ label, source, isSvg, savedSource, initialMapping, palettes, backgrounds, field }: { label: string; source: string; isSvg: boolean; savedSource: string; initialMapping: string; palettes: ThemePalettes; backgrounds: { light: string; dark: string }; field: string }) {
  const [svg, setSvg] = useState("");
  const [mapping, setMapping] = useState<LogoColorMapping>(() => parseLogoColorMapping(initialMapping));
  const [mode, setMode] = useState<"light" | "dark" | null>(null);
  const [error, setError] = useState("");
  const allColors = useMemo(() => svg ? extractLogoColors(svg) : [], [svg]);
  const colors = allColors.slice(0, 128);

  useEffect(() => {
    const controller = new AbortController();
    if (!source || !isSvg) {
      return () => controller.abort();
    }
    fetch(source, {signal: controller.signal}).then((response) => {
      if (!response.ok) throw new Error("Unable to read the SVG.");
      return response.text();
    }).then((text) => {
      if (!/<svg(?:\s|>)/i.test(text)) { setSvg(""); return; }
      setSvg(text); setError("");
      const previous = source === savedSource ? parseLogoColorMapping(initialMapping) : emptyLogoColorMapping();
      // An exact, unique palette match is safe to retain as a palette reference.
      for (const color of extractLogoColors(text).slice(0, 128)) {
        const matches = roles.flatMap((role) => THEME_TONES.filter((tone) => palettes[role][tone] === color).map((tone) => `${role}:${tone}`));
        if (matches.length === 1) for (const theme of ["light", "dark"] as const) previous[theme][color] ??= matches[0];
      }
      setMapping(previous);
    }).catch((reason) => { if (reason?.name !== "AbortError") { setSvg(""); setError("The SVG colours could not be read. The original logo will be used."); } });
    return () => controller.abort();
  }, [source, isSvg, savedSource, initialMapping, palettes]);

  if (!source || !isSvg) return <><input type="hidden" name={field} value="{}" />{source && <p className="body-small">{label}: PNG colours stay the same in both themes.</p>}</>;
  return <div className={styles.logoMapping}>
    <input type="hidden" name={field} value={JSON.stringify(mapping)} />
    {error ? <p role="alert" className="body-small">{error}</p> : !svg ? <p className="body-small">Reading {label.toLowerCase()} colours…</p> : colors.length === 0 ? <p className="body-small">No editable solid colours were found in this SVG. Its original appearance will be used.</p> : <>
      <div className={styles.fineTuningHeader}><h3>{label} colours</h3></div>
      <p className="body-small">Select a preview to assign palette shades for that theme. Unmatched colours keep their original value until changed. Gradients and effects keep their structure; solid gradient colours can also be mapped.</p>
      {allColors.length > 128 && <p className="body-small">The first 128 colours can be mapped; any remaining colours retain their original values.</p>}
      <div className={styles.logoModePreviews}>
        {(["light", "dark"] as const).map((theme) => {
          const preview = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(recolorLogoSvg(svg, mapping[theme], palettes))}`;
          return <Fragment key={theme}>
            <button type="button" className={`${styles.logoModePreview} ${mode === theme ? styles.previewSelected : ""}`} aria-pressed={mode === theme} style={{backgroundColor: backgrounds[theme]}} onClick={() => setMode(mode === theme ? null : theme)}>
              <span className={styles.logoModeLabel}>{theme} theme · {mode === theme ? "Close" : "Edit colours"}</span>
              {/* Uploaded SVGs are rendered as images, never inserted into the document. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt={`${label} in ${theme} theme`} />
            </button>
            {mode === theme && <section className={styles.logoColorControls} aria-label={`${label} ${theme} colour controls`}>
              {colors.map((color) => {
                const value = mapping[theme][color] ?? "original";
                return <div className={styles.tokenRow} key={color}>
                  <div className={styles.tokenName}><span>Original {color}</span></div>
                  <div className={styles.tokenValue}><i style={{background: resolveLogoColor(value, color, palettes)}} /><select className={adminStyles.input} aria-label={`${label} ${theme} original ${color}`} value={value} onChange={(event) => { const selection = event.target.value; setMapping((current) => ({...current, [theme]: {...current[theme], [color]: selection}})); }}>
                    <option value="original">Original · {color}</option>
                    {roles.map((role) => <optgroup key={role} label={role[0].toUpperCase() + role.slice(1)}>{role === "neutral" && <><option value="white">White · #FFFFFF</option><option value="black">Black · #000000</option></>}{THEME_TONES.map((tone) => <option value={`${role}:${tone}`} key={tone}>{role[0].toUpperCase() + role.slice(1)} {tone} · {palettes[role][tone]}</option>)}</optgroup>)}
                  </select></div>
                </div>;
              })}
            </section>}
          </Fragment>;
        })}
      </div>
    </>}
  </div>;
}
