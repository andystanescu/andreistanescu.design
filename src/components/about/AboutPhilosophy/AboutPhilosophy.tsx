import { AccentText } from "@/components/AccentText/AccentText";
import { getSection, getPhilosophyItems } from "@/lib/about";
import styles from "./AboutPhilosophy.module.css";

export function AboutPhilosophy() {
  const section = getSection("philosophy")!;
  const items = getPhilosophyItems();

  if (items.length === 0) {
    return null;
  }

  return (
    <section id="philosophy" className={styles.section}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.intro}>
          <p className="label-eyebrow" style={{ color: "var(--text-accent)" }}>
            {section.eyebrow}
          </p>
          <h2 className="display-small">
            <AccentText text={section.headline} />
          </h2>
          <p className="body-small" style={{ color: "var(--text-secondary)" }}>
            {section.description}
          </p>
        </div>
        <div className={styles.items}>
          {items.map((item, index) => (
            <div key={item.id} className={styles.item}>
              {item.icon && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.icon} alt="" />
              )}
              <p className="mono-token" style={{ color: "var(--text-accent)" }}>
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="heading-03">{item.title}</h3>
              <p className="body-small" style={{ color: "var(--text-secondary)" }}>
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
