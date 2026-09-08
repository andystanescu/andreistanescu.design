import { AccentText } from "@/components/AccentText/AccentText";
import { LatticeDiagram } from "@/components/home/Hero/LatticeDiagram";
import { LatticeInteractive } from "@/components/home/Hero/LatticeInteractive";
import { getVisibleSection } from "@/lib/about";
import { getSettings } from "@/lib/settings";
import { Button } from "@/components/Button/Button";
import styles from "./AboutHero.module.css";

export function AboutHero() {
  const section = getVisibleSection("hero")!;
  const settings = getSettings();
  const personal = settings.logo_identity === "personal";
  const heroImage = settings.about_hero_image;

  return (
    <section className={`container ${styles.hero} ${personal ? styles.personal : styles.business}`}>
      {personal && (
        <div className={styles.personalMark}>
          {heroImage ? (
            <img className={styles.personalPhoto} src={heroImage} alt={settings.author_name} />
          ) : (
            <img className={styles.personalLogoPlaceholder} src="/assets/logo-icon-personal.svg" alt="" />
          )}
        </div>
      )}
      <div className={styles.copy}>
        <p className="label-eyebrow" style={{ color: "var(--text-accent)" }}>
          {section.eyebrow}
        </p>
        <h1 className={`display-large ${styles.headline}`}>
          <AccentText text={section.headline} />
        </h1>
        <p className="body-large" style={{ color: "var(--text-secondary)" }}>
          {section.description}
        </p>
        {personal && settings.about_cv && (
          <div>
            <Button href="/api/cv-download" download>
              Download CV
            </Button>
          </div>
        )}
      </div>
      <div className={styles.lattice}>
        <LatticeInteractive>
          <LatticeDiagram />
        </LatticeInteractive>
      </div>
    </section>
  );
}
