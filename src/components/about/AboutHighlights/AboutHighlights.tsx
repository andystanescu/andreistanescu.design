import { AccentText } from "@/components/AccentText/AccentText";
import { getSection, getHighlightItems } from "@/lib/about";
import styles from "./AboutHighlights.module.css";

export function AboutHighlights() {
  const section = getSection("highlights")!;
  const items = getHighlightItems();

  if (items.length === 0) {
    return null;
  }

  return (
    <section id="highlights" className={`${styles.section} section-dark`}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.intro}>
          {section.eyebrow && (
            <p className="label-eyebrow" style={{ color: "var(--text-accent)" }}>
              {section.eyebrow}
            </p>
          )}
          <h2 className="display-small">
            <AccentText text={section.headline} />
          </h2>
          <p className="body-small" style={{ color: "var(--text-secondary)" }}>
            {section.description}
          </p>
        </div>
        <div className={styles.items}>
          {items.map((item) => (
            <div key={item.id} className={styles.item}>
              {item.icon && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.icon} alt="" />
              )}
              <div className={styles.itemCopy}>
                <h3 className="heading-03">{item.title}</h3>
                <p className="body-small" style={{ color: "var(--text-secondary)" }}>
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
