import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { Nav } from "@/components/Nav/Nav";
import { ScrollStack } from "@/components/home/ScrollStack/ScrollStack";
import { Footer } from "@/components/Footer/Footer";
import { RichContent } from "@/components/RichContent/RichContent";
import { getPublishedPage } from "@/lib/pages";
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { getServiceCapabilities, getServiceItems } from "@/lib/serviceItems";
import { SelectedImpact } from "@/components/home/SelectedImpact/SelectedImpact";
import { LatestInsights } from "@/components/home/LatestInsights/LatestInsights";
import { ServiceIndexItem } from "@/components/services/ServiceIndexItem/ServiceIndexItem";
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
      <ScrollStack className={styles.scrollSequence}>
        <main className={styles.main}>
          <div className={`${styles.scrollPanel} ${styles.groupedPanel}`} data-scroll-panel style={{ "--stack-order": 1 } as CSSProperties}>
            <div className={styles.groupedContent}>
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
              </section>

              <section className={`container ${styles.servicesSection}`}>
                {services.length === 0 ? (
                  <p className="body-default" style={{ color: "var(--text-tertiary)" }}>
                    Services are on their way — check back soon.
                  </p>
                ) : (
                  <ul className={styles.list}>
                    {services.map((service, index) => (
                      <ServiceIndexItem
                        key={service.slug}
                        slug={service.slug}
                        title={service.title}
                        description={service.description}
                        capabilities={getServiceCapabilities(service.slug)}
                        index={index + 1}
                      />
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>
          <div className={styles.scrollPanel} data-scroll-panel style={{ "--stack-order": 2 } as CSSProperties}>
            <SelectedImpact />
          </div>
          <div className={styles.scrollPanel} data-scroll-panel style={{ "--stack-order": 3 } as CSSProperties}>
            <LatestInsights />
          </div>
        </main>
        <div className={`${styles.scrollPanel} ${styles.footerPanel}`} data-scroll-panel data-scroll-mode="flow" style={{ "--stack-order": 4 } as CSSProperties}>
          <Footer
          />
        </div>
      </ScrollStack>
    </>
  );
}
