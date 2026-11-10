"use client";

import { useRef, useState, type PointerEvent } from "react";
import { useRouter } from "next/navigation";
import { NavigationIcon } from "@/components/Nav/NavigationIcon";
import { LogoIcon } from "@/components/Logo/LogoIcon";
import { Logo } from "@/components/Logo/Logo";
import filterStyles from "@/components/insights/InsightsListing/InsightsListing.module.css";
import styles from "./NavigationPreview.module.css";

type Item = { id: string; label: string };
type Props = { items: Item[]; logoIdentity: "business" | "personal"; logoImage: string; logoIconImage: string; initialStyle: "default" | "masthead" | "islands" | "menu-first" | "floating-rail" };

export function NavigationPreview({ items: initialItems, logoIdentity, logoImage, logoIconImage, initialStyle }: Props) {
  const [items, setItems] = useState(initialItems);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [navigationStyle, setNavigationStyle] = useState(initialStyle);
  const [publishedStyle, setPublishedStyle] = useState(initialStyle);
  const [menuFirstOpen, setMenuFirstOpen] = useState(true);
  const [dragging, setDragging] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const orderRef = useRef(initialItems);
  const dragRef = useRef<{ id: string; original: Item[]; x: number; y: number; moved: boolean } | null>(null);
  const router = useRouter();

  async function saveStyle() {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/navigation-style", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ style: navigationStyle }) });
      if (!response.ok) throw new Error("Save failed");
      setPublishedStyle(navigationStyle);
      setStatus("Navigation style saved.");
      router.refresh();
    } catch { setStatus("Unable to save the navigation style. Please try again."); }
    finally { setSaving(false); }
  }

  function reorder(id: string, target: string) {
    const current = orderRef.current;
    const from = current.findIndex((item) => item.id === id);
    const to = current.findIndex((item) => item.id === target);
    if (from < 0 || to < 0 || from === to) return;
    const next = [...current];
    next.splice(to, 0, next.splice(from, 1)[0]);
    orderRef.current = next;
    setItems(next);
  }

  async function save(previous: Item[]) {
    const next = orderRef.current;
    if (next.every((item, index) => item.id === previous[index]?.id)) return;
    setSaving(true);
    setStatus("Saving navigation order…");
    try {
      const response = await fetch("/api/admin/pages/reorder", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: next.map((item) => item.id) }) });
      if (!response.ok) throw new Error("Unable to save the order. Refresh the page and try again.");
      setStatus("Navigation order saved.");
      router.refresh();
    } catch {
      orderRef.current = previous;
      setItems(previous);
      setStatus("Unable to save the order. Refresh the page and try again.");
    } finally { setSaving(false); }
  }

  function start(event: PointerEvent<HTMLButtonElement>, id: string) {
    if (saving || event.button !== 0) return;
    dragRef.current = { id, original: [...orderRef.current], x: event.clientX, y: event.clientY, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function move(event: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    if (!drag.moved && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 5) return;
    if (!drag.moved) { drag.moved = true; setDragging(drag.id); }
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-nav-preview-item]")?.dataset.navPreviewItem;
    if (target) reorder(drag.id, target);
  }
  function end(event: PointerEvent<HTMLButtonElement>, cancelled = false) {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    setDragging(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (cancelled) { orderRef.current = drag.original; setItems(drag.original); }
    else if (drag.moved) void save(drag.original);
  }
  function moveBy(id: string, direction: number) {
    if (saving) return;
    const previous = [...orderRef.current];
    const index = previous.findIndex((item) => item.id === id);
    const target = previous[index + direction];
    if (!target) return;
    reorder(id, target.id);
    void save(previous);
  }

  const menu = <div className={`${device === "desktop" ? styles.desktopLinks : styles.mobileLinks} ${navigationStyle === "masthead" ? styles.mastheadMenu : navigationStyle === "islands" ? styles.islandsMenu : navigationStyle === "menu-first" ? styles.menuFirstMenu : navigationStyle === "floating-rail" ? styles.railMenu : ""}`} aria-label="Reorder navigation items">{items.map((item, index) => <div className={`${styles.item} ${dragging === item.id ? styles.dragging : ""}`} key={item.id} data-nav-preview-item={item.id}>
    {navigationStyle === "menu-first" && <span className={styles.menuFirstNumber}>{String(index + 1).padStart(2, "0")}</span>}
    <button type="button" className={styles.dragLabel} aria-label={`Drag ${item.label} to reorder`} disabled={saving} onPointerDown={(event) => start(event, item.id)} onPointerMove={move} onPointerUp={(event) => end(event)} onPointerCancel={(event) => end(event, true)}>{navigationStyle === "floating-rail" ? <><NavigationIcon page={item.id} custom /><span className={styles.railLabel}>{item.label}</span></> : navigationStyle === "islands" && device === "mobile" ? <NavigationIcon page={item.id} custom /> : item.label}</button>
    <span className={styles.moveControls}><button type="button" onClick={() => moveBy(item.id, -1)} disabled={saving || index === 0} aria-label={`Move ${item.label} earlier`}>‹</button><button type="button" onClick={() => moveBy(item.id, 1)} disabled={saving || index === items.length - 1} aria-label={`Move ${item.label} later`}>›</button></span>
  </div>)}</div>;

  return <section className={styles.editor} aria-labelledby="navigation-preview-title">
    <div className={styles.heading}><div><h2 id="navigation-preview-title" className="heading-02">Main navigation</h2><p className="body-small">Drag the menu labels to reorder them, or use the move buttons. Changes save automatically.</p></div><div className={styles.devices} aria-label="Preview size"><button type="button" aria-pressed={device === "desktop"} onClick={() => setDevice("desktop")}>Desktop</button><button type="button" aria-pressed={device === "mobile"} onClick={() => setDevice("mobile")}>Mobile</button></div></div>
    <div className={styles.styleControls}><fieldset className={styles.styleOptions}><legend>Navigation style</legend><div className={filterStyles.filters}>{([ ["default", "Default"], ["masthead", "Masthead"], ["islands", "Islands"], ["menu-first", "Menu-first"], ["floating-rail", "Floating rail"] ] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={navigationStyle === value} className={navigationStyle === value ? filterStyles.filterActive : filterStyles.filter} onClick={() => setNavigationStyle(value)}>{label}</button>)}</div></fieldset></div>
    <p className={styles.status} role="status" aria-live="polite">{status || "Only published pages shown in the main navigation appear here."}</p>
    {navigationStyle === "floating-rail" ? <div className={`${device === "desktop" ? styles.desktopPreview : styles.mobilePreview} ${styles.railPreview} ${device === "mobile" ? styles.railMobile : ""}`}><div className={styles.railBrand}><LogoIcon identity={logoIdentity} imageUrl={logoIconImage} /></div>{menu}<div className={styles.railTheme} aria-hidden="true">{device === "desktop" ? "☼ ◐ ☾" : "☾"}</div></div> : navigationStyle === "menu-first" ? <div className={`${device === "desktop" ? styles.desktopPreview : styles.mobilePreview} ${styles.menuFirstPreview} ${device === "mobile" ? styles.menuFirstMobile : ""}`}><div className={styles.menuFirstBar}><Logo variant="compact" identity={logoIdentity} imageUrl={logoImage} /><div className={styles.menuFirstBarActions}>{device === "desktop" && <span aria-hidden="true">☼ ◐ ☾</span>}<button type="button" className={styles.menuFirstToggle} aria-expanded={menuFirstOpen} onClick={() => setMenuFirstOpen(!menuFirstOpen)}>{menuFirstOpen ? "Close ×" : "Menu ☰"}</button>{device === "desktop" && <span className={styles.cta}>Let&apos;s talk →</span>}</div></div>{menuFirstOpen && <div className={styles.menuFirstPanel}>{menu}{device === "mobile" && <div className={styles.menuFirstActions}><span className={styles.cta}>Let&apos;s talk →</span><span aria-hidden="true">☼ ◐ ☾</span></div>}</div>}</div> : navigationStyle === "islands" ? (device === "desktop" ? <div className={`${styles.desktopPreview} ${styles.islandsDesktop}`}><div className={styles.islandsBrand}><Logo variant="compact" identity={logoIdentity} imageUrl={logoImage} /></div>{menu}<div className={styles.islandsActions}><span className={styles.cta}>Let&apos;s talk <span aria-hidden="true">→</span></span><span aria-hidden="true">☼ ◐ ☾</span></div></div> : <div className={`${styles.mobilePreview} ${styles.islandsMobile}`}><div className={styles.islandsMobileBrand}><Logo variant="compact" identity={logoIdentity} imageUrl={logoImage} /></div><div className={styles.islandsMobileDock}>{menu}<span className={styles.cta}>Let&apos;s talk</span></div></div>) : navigationStyle === "masthead" ? (device === "desktop" ? <div className={styles.desktopPreview}><div className={styles.mastheadBrand}><span aria-hidden="true">☼ ◐ ☾</span><Logo variant="compact" identity={logoIdentity} imageUrl={logoImage} /><span className={styles.cta}>Let&apos;s talk <span aria-hidden="true">→</span></span></div>{menu}</div> : <div className={`${styles.mobilePreview} ${styles.mastheadMobile}`}>{menu}<div className={styles.mastheadMobileBar}><Logo variant="compact" identity={logoIdentity} imageUrl={logoImage} /><span aria-hidden="true">☼ ◐ ☾</span><span className={styles.cta}>Let&apos;s talk</span></div></div>) : (device === "desktop" ? <div className={styles.desktopPreview}><div className={styles.desktopBar}><Logo variant="compact" identity={logoIdentity} imageUrl={logoImage} />{menu}<div className={styles.desktopControls}><span className={styles.cta}>Let&apos;s talk <span aria-hidden="true">→</span></span><span aria-hidden="true">☼ ◐ ☾</span></div></div></div> : <div className={styles.mobilePreview}><div className={styles.mobileMenu}>{menu}<span className={styles.cta}>Let&apos;s talk <span aria-hidden="true">→</span></span></div><div className={styles.mobileBar}><Logo variant="compact" identity={logoIdentity} imageUrl={logoImage} /><span aria-hidden="true">☼ ◐ ☾ &nbsp; ☰</span></div></div>)}
    <div><button type="button" className={styles.saveStyle} onClick={saveStyle} disabled={saving || navigationStyle === publishedStyle}>Save navigation style</button></div>
    {items.length === 0 && <p className="body-small">No published pages are shown in the main navigation.</p>}
  </section>;
}
