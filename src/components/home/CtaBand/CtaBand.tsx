import { Button } from "@/components/Button/Button";
import { ArrowIcon } from "@/components/Icon/ArrowIcon";
import styles from "./CtaBand.module.css";

export function CtaBand() {
  return (
    <section className={styles.ctaSection}>
      <div className="container">
        {/* The deep plane — reserved for exactly this one closing moment
            per page. */}
        <div className={`${styles.band} section-deep`}>
          <p className="label-eyebrow" style={{ color: "var(--text-accent)" }}>
            got a project in mind?
          </p>
          <h2 className="display-small">
            Let&apos;s talk about the system underneath.
          </h2>
          <p className="body-large" style={{ color: "var(--text-secondary)" }}>
            Whether you are starting from nothing or untangling something
            that grew too fast.
          </p>
          <Button href="/contact" icon={<ArrowIcon size={16} />}>
            Start a conversation
          </Button>
        </div>
      </div>
    </section>
  );
}
