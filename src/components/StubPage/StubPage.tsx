import { Nav } from "@/components/Nav/Nav";
import { Footer } from "@/components/Footer/Footer";
import styles from "./StubPage.module.css";

type StubPageProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function StubPage({ eyebrow, title, description }: StubPageProps) {
  return (
    <>
      <Nav />
      <main className={styles.main}>
        <p className="label-eyebrow" style={{ color: "var(--text-accent)" }}>
          {eyebrow}
        </p>
        <h1 className="display-small">{title}</h1>
        <p className="body-large" style={{ color: "var(--text-secondary)" }}>
          {description}
        </p>
      </main>
      <Footer />
    </>
  );
}
