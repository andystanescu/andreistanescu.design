import Link from "next/link";
import { getHomepageServiceItems } from "@/lib/serviceItems";
import { AccentText } from "@/components/AccentText/AccentText";
import { getSection } from "@/lib/homepage";
import styles from "./Services.module.css";

export function Services() {
  const section = getSection("services")!;
  const services = getHomepageServiceItems();

  if (services.length === 0) {
    return null;
  }

  return (
    <section id="services" className={`${styles.services} section-dark`}>
      <div className={`container ${styles.servicesInner}`}>
        <div className={styles.intro}>
          <h2 className="display-small">
            <AccentText text={section.headline} />
          </h2>
        </div>
        <div className={styles.grid}>
          {services.map((service) => (
            <Link
              key={service.slug}
              href={`/services/${service.slug}`}
              className={styles.card}
            >
              {service.icon && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={service.icon} alt="" width={46.2} height={46.2} />
              )}
              <h3 className="heading-03">{service.title}</h3>
              <p className="body-small" style={{ color: "var(--text-secondary)" }}>
                {service.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
