import { Nav } from "@/components/Nav/Nav";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer/Footer";
import { RichContent } from "@/components/RichContent/RichContent";
import { getPublishedPage } from "@/lib/pages";
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import styles from "@/components/StubPage/StubPage.module.css";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const page = getPublishedPage("privacy");
  return page ? pageMetadata(page, "/privacy") : {};
}

export default function PrivacyPage() {
  const page = getPublishedPage("privacy");
  if (!page) notFound();

  return (
    <>
      <Nav />
      <main className={styles.main}>
        <p className="label-eyebrow" style={{ color: "var(--text-accent)" }}>
          {page.eyebrow}
        </p>
        <h1 className="display-small">{page.title}</h1>
        <RichContent html={page.body} />
      </main>
      <Footer />
    </>
  );
}
