import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav/Nav";
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
        <SelectedImpact />
        <LatestInsights />
      </main>
      <Footer
        contactPrompt="Recognise the problem but not sure which service it fits? Tell me what is getting in the way and we can work out the right direction together."
        contactActionLabel="Start a conversation"
      />
    </>
  );
}
