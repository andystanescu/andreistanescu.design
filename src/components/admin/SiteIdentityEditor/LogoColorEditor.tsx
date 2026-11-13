"use client";

import { useEffect, useId, useMemo, useState, type ChangeEvent, type CSSProperties } from "react";
import { AdminIcon } from "@/components/admin/AdminIcon/AdminIcon";
import { Logo } from "@/components/Logo/Logo";
import { extractLogoColors, emptyLogoColorMapping, parseLogoColorMapping, recolorLogoSvg, resolveLogoColor, type LogoColorMapping } from "@/lib/logoColors";
import { THEME_TONES, type PaletteRole, type ThemePalettes } from "@/lib/themePalette";
import adminStyles from "@/app/admin/(dashboard)/admin.module.css";
import styles from "./SiteIdentityEditor.module.css";

const roles: PaletteRole[] = ["primary", "secondary", "accent", "neutral"];
type Mode = "light" | "dark";

export function LogoColorEditor({ label, source, isSvg, savedSource, initialMapping, palettes, backgrounds, foregrounds, field, uploadName, onUpload, activeMode, identity, icon = false }: { label: string; source: string; isSvg: boolean; savedSource: string; initialMapping: string; palettes: ThemePalettes; backgrounds: Record<Mode, string>; foregrounds: Record<Mode, string>; field: string; uploadName: string; onUpload: (event: ChangeEvent<HTMLInputElement>) => void; activeMode: Mode; identity: "business" | "personal"; icon?: boolean }) {
  const uploadId = useId();
  const [loaded, setLoaded] = useState({ source: "", svg: "" });
  const [mapping, setMapping] = useState<LogoColorMapping>(() => parseLogoColorMapping(initialMapping));
  const [error, setError] = useState("");
  const svg = loaded.source === source && isSvg ? loaded.svg : "";
  const allColors = useMemo(() => svg ? extractLogoColors(svg) : [], [svg]);
  const colors = allColors.slice(0, 128);
  const modes: Mode[] = activeMode === "light" ? ["light", "dark"] : ["dark", "light"];

  useEffect(() => {
    const controller = new AbortController();
    if (!source || !isSvg) return () => controller.abort();
    fetch(source, {signal: controller.signal}).then((response) => {
      if (!response.ok) throw new Error("Unable to read the SVG.");
      return response.text();
    }).then((text) => {
      if (!/<svg(?:\s|>)/i.test(text)) { setLoaded({source, svg: ""}); setError("This file is not a readable SVG."); return; }
      setLoaded({source, svg: text}); setError("");
      const previous = source === savedSource ? parseLogoColorMapping(initialMapping) : emptyLogoColorMapping();
      for (const color of extractLogoColors(text).slice(0, 128)) {
        const matches = roles.flatMap((role) => THEME_TONES.filter((tone) => palettes[role][tone] === color).map((tone) => `${role}:${tone}`));
        if (matches.length === 1) for (const theme of ["light", "dark"] as const) previous[theme][color] ??= matches[0];
      }
      setMapping(previous);
    }).catch((reason) => { if (reason?.name !== "AbortError") { setLoaded({source, svg: ""}); setError("The SVG colours could not be read. The original logo will be used."); } });
    return () => controller.abort();
  }, [source, isSvg, savedSource, initialMapping, palettes]);

  return <div className={styles.logoVariant}>
    <span className={styles.logoVariantLabel}>{icon ? "Icon only · favicon" : "Full logo"}</span>
    <input type="hidden" name={field} value={source && isSvg ? JSON.stringify(mapping) : "{}"} />
    <input id={uploadId} className={styles.logoFileInput} type="file" name={uploadName} accept=".png,.svg,image/png,image/svg+xml" onChange={onUpload} aria-label={`Upload ${icon ? "icon" : "full logo"}`} />
    <div className={styles.logoPreviewGrid}>
      {modes.map((theme, index) => {
        const preview = svg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(recolorLogoSvg(svg, mapping[theme], palettes))}` : source;
        return <div className={styles.logoPreviewColumn} key={theme}>
          <span className={styles.logoPreviewTheme}>{theme} theme{index === 0 ? " · active" : ""}</span>
          <label htmlFor={uploadId} className={`${styles.logoPreview} ${icon ? styles.iconLogoPreview : styles.fullLogoPreview}`} style={{backgroundColor: backgrounds[theme], color: foregrounds[theme], "--text-primary": foregrounds[theme]} as CSSProperties}>
            {preview ? <>
              {/* SVGs remain image resources rather than being inserted into the page. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt={`${label} in ${theme} theme`} />
            </> : icon ? <span className="body-small">Upload an icon</span> : <span className={styles.logoFallback}><Logo variant="primary" identity={identity} /></span>}
            <span className={styles.uploadIcon} aria-hidden="true"><AdminIcon name="action-upload" /></span>
          </label>
          {svg && colors.length > 0 && <section className={styles.logoColorControls} aria-label={`${label} ${theme} colour controls`}>
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
        </div>;
      })}
    </div>
    <span className="body-small">PNG or SVG, up to 8 MB.{icon ? " This also becomes the browser favicon." : ""}</span>
    {source && !isSvg && <p className="body-small">PNG colours stay the same in both themes.</p>}
    {source && isSvg && !svg && !error && <p className="body-small">Reading {label.toLowerCase()} colours…</p>}
    {error && <p role="alert" className="body-small">{error}</p>}
    {svg && colors.length === 0 && <p className="body-small">No editable solid colours were found in this SVG. Its original appearance will be used.</p>}
    {allColors.length > 128 && <p className="body-small">The first 128 colours can be mapped; any remaining colours retain their original values.</p>}
  </div>;
}
