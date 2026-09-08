import { Nav } from "@/components/Nav/Nav";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer/Footer";
import { RichContent } from "@/components/RichContent/RichContent";
import { LatticeDiagram } from "@/components/home/Hero/LatticeDiagram";
import { LatticeInteractive } from "@/components/home/Hero/LatticeInteractive";
import { SelectedImpact } from "@/components/home/SelectedImpact/SelectedImpact";
import { LatestInsights } from "@/components/home/LatestInsights/LatestInsights";
import { getPublishedPage } from "@/lib/pages";
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { getApproachSteps } from "@/lib/approachSteps";
import { getSettings } from "@/lib/settings";
import styles from "./approach.module.css";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const page = getPublishedPage("approach");
  return page ? pageMetadata(page, "/approach") : {};
}

export default function ApproachPage() {
  const page = getPublishedPage("approach");
  if (!page) notFound();
  const steps = getApproachSteps();
  const settings = getSettings();
  const audienceCards = [
    [settings.approach_audience_leadership_title, settings.approach_audience_leadership_body],
    [settings.approach_audience_product_title, settings.approach_audience_product_body],
    [settings.approach_audience_org_title, settings.approach_audience_org_body],
  ];

  return (
    <>
      <Nav />
      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={`container ${styles.heroInner}`}>
            <div className={styles.heroCopy}>
              <p className="label-eyebrow" style={{ color: "var(--text-accent)" }}>{page.eyebrow}</p>
              <h1 className="display-small">{page.title}</h1>
              <div className={styles.heroDescription}><RichContent html={page.body} /></div>
            </div>
            <div className={styles.heroLattice} aria-hidden="true"><LatticeInteractive><LatticeDiagram /></LatticeInteractive></div>
          </div>
        </section>
        <section className={`${styles.principle} section-dark`}>
          <div className={`container ${styles.principleInner}`}>
            <div><p className="label-eyebrow" style={{ color: "var(--text-accent)" }}>{settings.approach_principle_eyebrow}</p><h2 className="heading-01">{settings.approach_principle_title}</h2></div>
            <p className="body-default" style={{ color: "var(--text-secondary)" }}>{settings.approach_principle_body}</p>
          </div>
        </section>
        <section className={`container ${styles.process}`}>
          <p className="label-eyebrow" style={{ color: "var(--text-accent)" }}>{settings.approach_how_eyebrow}</p>
          <h2 className="heading-01">{settings.approach_how_title}</h2>
          {steps.length > 0 ? <ol className={styles.steps}>{steps.map((step, index) => <li key={step.id} className={styles.step}><div className={styles.rule} /><p className="mono-token" style={{ color: "var(--text-accent)" }}>{String(index + 1).padStart(2, "0")}</p><h3 className="heading-03">{step.title}</h3><p className="body-small" style={{ color: "var(--text-secondary)" }}>{step.description}</p></li>)}</ol> : <p className="body-default" style={{ color: "var(--text-tertiary)" }}>My approach is on its way — check back soon.</p>}
        </section>
        <section className={`container ${styles.leaveBehind}`}>
          <p className="label-eyebrow" style={{ color: "var(--text-accent)" }}>{settings.approach_leave_eyebrow}</p>
          <div className={styles.leaveGrid}>{[[settings.approach_leave_one_title, settings.approach_leave_one_body], [settings.approach_leave_two_title, settings.approach_leave_two_body], [settings.approach_leave_three_title, settings.approach_leave_three_body]].map(([title, description], index) => <article key={title} className={styles.leaveCard}><img src="/assets/mark-design-systems.svg" alt="" className={styles.leaveIcon} /><p className="mono-token" style={{ color: "var(--text-accent)" }}>{String(index + 1).padStart(2, "0")}</p><h3 className="heading-03">{title}</h3><p className="body-small" style={{ color: "var(--text-secondary)" }}>{description}</p></article>)}</div>
        </section>
        <section className={`container ${styles.shared}`}>
          <h2 className="heading-01">{settings.approach_shared_title}</h2>
          <p className="body-default" style={{ color: "var(--text-secondary)" }}>{settings.approach_shared_body}</p>
          <div className={styles.audienceGrid}>{audienceCards.map(([title, description]) => <article key={title} className={styles.audienceCard}><h3 className="heading-03">{title}</h3><p className="body-small" style={{ color: "var(--text-secondary)" }}>{description}</p></article>)}</div>
        </section>
        <SelectedImpact />
        <LatestInsights />
      </main>
      <Footer />
    </>
  );
}
