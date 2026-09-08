import { Button } from "@/components/Button/Button";
import { Footer } from "@/components/Footer/Footer";
import { LatticeDiagram } from "@/components/home/Hero/LatticeDiagram";
import { LatticeInteractive } from "@/components/home/Hero/LatticeInteractive";
import { ArrowIcon } from "@/components/Icon/ArrowIcon";
import { Nav } from "@/components/Nav/Nav";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <>
      <Nav />
      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={`container ${styles.heroInner}`}>
            <div className={styles.copy}>
              <p className="label-eyebrow" style={{ color: "var(--text-accent)" }}>PAGE NOT FOUND</p>
              <p className={styles.code}>404</p>
              <h1 className="display-small">This page isn&apos;t part<br />of the system.</h1>
              <p className="body-large" style={{ color: "var(--text-secondary)" }}>The address may have changed, or the page may no longer exist.<br />Let&apos;s get you back to something useful.</p>
              <Button href="/" icon={<ArrowIcon size={16} />}>Back to homepage</Button>
            </div>
            <div className={styles.lattice} aria-label="A lattice with an irregular animation">
              <LatticeInteractive mode="jumpy"><LatticeDiagram /></LatticeInteractive>
            </div>
          </div>
        </section>
        <section className={`${styles.reassurance} section-dark`}>
          <div className="container">
            <h2 className="heading-02">Lost in the system?</h2>
            <p className="body-default" style={{ color: "var(--text-secondary)" }}>Use the links above to find your way back to the work.</p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
