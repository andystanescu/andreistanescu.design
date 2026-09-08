import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav/Nav";
import { Footer } from "@/components/Footer/Footer";
import { RichContent } from "@/components/RichContent/RichContent";
import { getPublishedPage } from "@/lib/pages";
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { getServiceItems } from "@/lib/serviceItems";
import { LatticeDiagram } from "@/components/home/Hero/LatticeDiagram";
import { LatticeInteractive } from "@/components/home/Hero/LatticeInteractive";
import { SelectedImpact } from "@/components/home/SelectedImpact/SelectedImpact";
import { LatestInsights } from "@/components/home/LatestInsights/LatestInsights";
import styles from "./services.module.css";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const page = getPublishedPage("services");
  return page ? pageMetadata(page, "/services") : {};
}

export default function ServicesPage() {
  const page = getPublishedPage("services");
  if (!page) notFound();
  const services = getServiceItems();

  return (
    <>
      <Nav />
      <main className={styles.main}>
        <section className={`container ${styles.hero}`}>
          <div className={styles.heroCopy}>
            <p className="label-eyebrow" style={{ color: "var(--text-accent)" }}>
              {page.eyebrow}
            </p>
            <h1 className="display-small">{page.title}</h1>
            <div className={styles.heroDescription}>
              <RichContent html={page.body} />
            </div>
          </div>
          <div className={styles.lattice} aria-hidden="true">
            <LatticeInteractive>
              <LatticeDiagram />
            </LatticeInteractive>
          </div>
        </section>

        <section className={`container ${styles.servicesSection}`}>
          {services.length === 0 ? (
            <p className="body-default" style={{ color: "var(--text-tertiary)" }}>
              Services are on their way — check back soon.
            </p>
          ) : (
            <ul className={styles.list}>
              {services.map((service) => (
                <li key={service.slug} className={service.card_size === "large" ? styles.largeItem : ""}>
                  <Link href={`/services/${service.slug}`} className={`${styles.card} ${service.card_size === "large" ? styles.cardLarge : ""}`}>
                    {service.icon && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={service.icon} alt="" className={`${styles.icon} ${service.card_size === "large" ? styles.iconOnDark : styles.iconOnLight}`} />
                    )}
                    <h2 className="heading-02">{service.title}</h2>
                    <p className="body-default" style={{ color: "var(--text-secondary)" }}>
                      {service.description}
                    </p>
                    <span className={styles.cardLink}>Learn more <span aria-hidden="true">→</span></span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <SelectedImpact />
        <LatestInsights />
      </main>
      <Footer />
    </>
  );
}
