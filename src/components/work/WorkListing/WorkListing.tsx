"use client";

import { useRef, useState, type PointerEvent } from "react";
import { ProjectCollection, type ProjectSummary } from "@/components/work/ProjectCollection/ProjectCollection";
import filterStyles from "@/components/insights/InsightsListing/InsightsListing.module.css";
import styles from "./WorkListing.module.css";

type Category = { id: number; name: string };
type Study = ProjectSummary & { categoryIds: number[] };

export function WorkListing({ studies, categories }: { studies: Study[]; categories: Category[] }) {
  const [selected, setSelected] = useState<number | null>(null);
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0 });
  const visibleStudies = selected === null ? studies : studies.filter((study) => study.categoryIds.includes(selected));
  const selectedName = categories.find((category) => category.id === selected)?.name;

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    drag.current.active = event.pointerType !== "touch" && event.button === 0 && event.currentTarget.scrollWidth > event.currentTarget.clientWidth;
    drag.current.startX = event.clientX;
    drag.current.scrollLeft = event.currentTarget.scrollLeft;
  };
  const moveDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active || Math.abs(event.clientX - drag.current.startX) <= 4) return;
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.scrollLeft = drag.current.scrollLeft - (event.clientX - drag.current.startX);
  };
  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    drag.current.active = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return <div className={styles.listing}>
    <div className={filterStyles.filters} role="group" aria-label="Filter case studies by category" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}>
      <button type="button" aria-pressed={selected === null} className={selected === null ? filterStyles.filterActive : filterStyles.filter} onClick={() => setSelected(null)}>All</button>
      {categories.map((category) => <button key={category.id} type="button" aria-pressed={selected === category.id} className={selected === category.id ? filterStyles.filterActive : filterStyles.filter} onClick={() => setSelected(category.id)}>{category.name}</button>)}
    </div>
    {visibleStudies.length > 0 ? <ProjectCollection studies={visibleStudies} /> : <section className={styles.empty} role="status">
      <p className="label-eyebrow">NO MATCHES</p>
      <h2 className="heading-02">Nothing published in {selectedName} yet</h2>
      <p className={`body-default ${styles.emptyDescription}`}>I’m still writing up this work. Browse another category, or view all case studies.</p>
      <button type="button" className={styles.showAll} onClick={() => setSelected(null)}>Show all case studies <span aria-hidden="true">→</span></button>
    </section>}
  </div>;
}
