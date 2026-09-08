import { Nav } from "@/components/Nav/Nav";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer/Footer";
import { RichContent } from "@/components/RichContent/RichContent";
import { ContactForm } from "@/components/ContactForm/ContactForm";
import { getPublishedPage } from "@/lib/pages";
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import styles from "./contact.module.css";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const page = getPublishedPage("contact");
  return page ? pageMetadata(page, "/contact") : {};
}

export default function ContactPage() {
  const page = getPublishedPage("contact");
  if (!page) notFound();
  const personal = getSettings().logo_identity === "personal";

  return (
    <>
      <Nav />
      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={`container ${styles.heroInner}`}>
            <div className={styles.intro}>
              <p className="label-eyebrow" style={{ color: "var(--text-accent)" }}>{page.eyebrow}</p>
              <h1 className="display-small">{page.title}</h1>
              <div className={styles.introDescription}><RichContent html={page.body} /></div>
            </div>
            <ContactForm personal={personal} />
          </div>
        </section>
        <section className={`${styles.reassurance} section-dark`}>
          <div className={`container ${styles.reassuranceInner}`}>
            <div>
              <p className="label-eyebrow" style={{ color: "var(--text-accent)" }}>WHAT HAPPENS NEXT</p>
              <h2 className="heading-01">A thoughtful first conversation,<br />with no hard sell.</h2>
            </div>
            <p className="body-default" style={{ color: "var(--text-secondary)" }}>
              {personal ? "I listen, ask the right questions and suggest a sensible next step." : "We listen, ask the right questions and suggest a sensible next step."}
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
