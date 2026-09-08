import { Button } from "@/components/Button/Button";
import { ArrowIcon } from "@/components/Icon/ArrowIcon";
import { AccentText } from "@/components/AccentText/AccentText";
import { getVisibleSection, getSectionOrder } from "@/lib/homepage";
import { LatticeDiagram } from "./LatticeDiagram";
import { LatticeInteractive } from "./LatticeInteractive";
import { DiagramLayout } from "./DiagramLayout";
import { getSettings } from "@/lib/settings";
import styles from "./Hero.module.css";

export function Hero() {
  const section = getVisibleSection("hero")!;
  const [firstSectionKey] = getSectionOrder();
  const personal = getSettings().logo_identity === "personal";
  const primaryLabel = personal ? "See my work" : section.cta_primary_label;
  const primaryHref = personal ? "/work" : section.cta_primary_href;
  const secondaryLabel = personal ? "Read articles" : section.cta_secondary_label;
  const secondaryHref = personal ? "/insights" : section.cta_secondary_href;

  return (
    <section className={styles.hero}>
      <div className={`container ${styles.heroInner}`}>
        <div className={styles.copy}>
          <h1 className={`display-large ${styles.headline}`}>
            <AccentText text={section.headline} color="var(--accent-foundation)" />
          </h1>
          <p className="body-large" style={{ color: "var(--text-secondary)" }}>
            {section.description}
          </p>
          <div className={styles.actions}>
            <Button href={primaryHref} icon={<ArrowIcon size={20} />}>
              {primaryLabel}
            </Button>
            <Button
              variant="link"
              href={secondaryHref}
              icon={<ArrowIcon size={20} />}
            >
              {secondaryLabel}
            </Button>
          </div>
        </div>

        <DiagramLayout
          lattice={
            <LatticeInteractive>
              <LatticeDiagram />
            </LatticeInteractive>
          }
          legend={
            <>
              <div className={styles.legendItem}>
                <div className={styles.legendLabel}>
                  <img
                    src="/assets/legend-dot-foundations.svg"
                    alt=""
                    width={9}
                    height={9}
                  />
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
                  <img
                    src="/assets/legend-dot-system.svg"
                    alt=""
                    width={9}
                    height={9}
                  />
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
