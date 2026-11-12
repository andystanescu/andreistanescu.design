import { Button } from "@/components/Button/Button";
import { ArrowIcon } from "@/components/Icon/ArrowIcon";
import { AccentText } from "@/components/AccentText/AccentText";
import { getVisibleSection, getSectionOrder } from "@/lib/homepage";
import { LatticeDiagram } from "./LatticeDiagram";
import { LatticeFormations } from "./LatticeFormations";
import { DiagramLayout } from "./DiagramLayout";
import { HeroCollage } from "./HeroCollage";
import styles from "./Hero.module.css";

export function Hero({ preview = false }: { preview?: boolean } = {}) {
  const section = getVisibleSection("hero")!;
  const [firstSectionKey] = getSectionOrder();
  const primaryLabel = section.cta_primary_label || "See my work";
  const primaryHref = section.cta_primary_href.trim();
  const secondaryLabel = section.cta_secondary_label || "Read articles";
  const secondaryHref = section.cta_secondary_href.trim();

  return (
    <section className={styles.hero}>
      <HeroCollage />
      <div className={`container ${styles.heroInner}`}>
        <div className={styles.copy}>
          {section.eyebrow && (
            <p className={`label-eyebrow ${styles.eyebrow}`}>
              {section.eyebrow}
            </p>
          )}
          <h1 className={`display-large ${styles.headline}`}>
            <AccentText text={section.headline} color="var(--accent-foundation)" />
          </h1>
          <p className="body-large" style={{ color: "var(--text-secondary)" }}>
            {section.description}
          </p>
          {(preview || primaryHref || secondaryHref) && <div className={styles.actions}>
            {(preview || primaryHref) && <Button href={primaryHref || "#"} icon={<ArrowIcon size={20} />}>
              {primaryLabel}
            </Button>}
            {(preview || secondaryHref) && <Button
              variant="link"
              href={secondaryHref || "#"}
              icon={<ArrowIcon size={20} />}
            >
              {secondaryLabel}
            </Button>}
          </div>}
        </div>

        <DiagramLayout
          lattice={
            <LatticeFormations>
              <LatticeDiagram label="An interactive lattice of connected dots that forms a series of familiar shapes." />
            </LatticeFormations>
          }
          legend={
            <>
              <div className={styles.legendItem}>
                <div className={styles.legendLabel}>
                  <span className={`${styles.legendDot} ${styles.foundationDot}`} aria-hidden="true" />
                  <p className="label-eyebrow">Foundations</p>
                </div>
                <p
                  className="body-small"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Core principles that anchor the system.
                </p>
              </div>
              <div className={styles.legendItem}>
                <div className={styles.legendLabel}>
                  <span className={`${styles.legendDot} ${styles.systemDot}`} aria-hidden="true" />
                  <p className="label-eyebrow">System</p>
                </div>
                <p
                  className="body-small"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Everything that emerges from strong foundations.
                </p>
              </div>
            </>
          }
        />
      </div>

      <a
        href={firstSectionKey ? `#${firstSectionKey}` : "#"}
        className={styles.scrollHint}
        aria-label="Scroll to see more"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M4 7.5L10 13.5L16 7.5"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </a>
    </section>
  );
}
