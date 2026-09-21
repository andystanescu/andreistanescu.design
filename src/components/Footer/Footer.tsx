import { Logo } from "@/components/Logo/Logo";
import { Button } from "@/components/Button/Button";
import { ArrowIcon } from "@/components/Icon/ArrowIcon";
import { AdminBar } from "@/components/AdminBar/AdminBar";
import { FooterLink } from "./FooterLink";
import { getServiceItems } from "@/lib/serviceItems";
import { getSettings } from "@/lib/settings";
import { getNavLinks, getPublishedPage } from "@/lib/pages";
import styles from "./Footer.module.css";

export function Footer({ variant = "full", hideContactCta = false }: { variant?: "full" | "compact"; hideContactCta?: boolean }) {
  const navigationLinks = getNavLinks();
  const settings = getSettings();
  const services = getServiceItems();
  const copyrightName = settings.logo_identity === "personal" ? "Andrei Stanescu" : "ConScept";
  const privacyPage = getPublishedPage("privacy");
  const termsPage = getPublishedPage("terms");
  const compactContent = (
    <div className={`container ${styles.compactInner}`}>
      {!hideContactCta && (
        <div className={styles.compactPrompt}>
          <p className="body-large">Have a project in mind or want to explore how I can help?</p>
          <FooterLink href="/contact" className={styles.compactCta}>Let&apos;s talk <span aria-hidden="true">→</span></FooterLink>
        </div>
      )}
      <nav className={styles.compactLinks} aria-label="Footer navigation">
        <FooterLink href="/work">Work</FooterLink>
        <FooterLink href="/insights">Articles</FooterLink>
        <FooterLink href="/about">About</FooterLink>
        <FooterLink href="/services">Services</FooterLink>
      </nav>
      <p className={styles.compactCopyright}>© Andrei Stanescu</p>
    </div>
  );

  if (variant === "compact") {
    return (
      <>
        <footer className={`${styles.footer} ${styles.compactFooter} section-dark`}>
          {compactContent}
        </footer>
        <AdminBar />
      </>
    );
  }

  return (
    <>
      <footer className={`${styles.footer} section-dark`}>
        <div className={`container ${styles.footerInner}`}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <Logo variant="primary" theme="inverted" identity={settings.logo_identity} />
            <p className="body-small" style={{ color: "var(--text-secondary)" }}>
              Designing the foundations that exceptional products are built
              upon.
            </p>
          </div>

          <div className={styles.linksGroup}>
            <div className={styles.column}>
              <p className="label-small">Services</p>
              {services.map((service) => (
                <FooterLink
                  key={service.slug}
                  href={`/services/${service.slug}`}
                  className="body-small"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {service.title}
                </FooterLink>
              ))}
            </div>

            <div className={styles.column}>
              <p className="label-small">Navigation</p>
              {navigationLinks.map((link) => (
                <FooterLink
                  key={link.href}
                  href={link.href}
                  className="body-small"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {link.label}
                </FooterLink>
              ))}
            </div>

            {!hideContactCta && (
              <div className={styles.connect}>
                <p className="label-small">Let&apos;s connect</p>
                <p className="body-small" style={{ color: "var(--text-secondary)" }}>
                  Have a project in mind or want to explore how {settings.logo_identity === "personal" ? "I" : "we"} can help?
                </p>
                <Button href="/contact" icon={<ArrowIcon size={16} />}>
                  Let&apos;s talk
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.bottom}>
          <p className="body-small" style={{ color: "var(--text-tertiary)" }}>
            © {copyrightName} 2026
          </p>
          <div className={styles.legal}>
            {privacyPage && <FooterLink href="/privacy" className="body-small" style={{ color: "var(--text-tertiary)" }}>Privacy</FooterLink>}
            {termsPage && <FooterLink href="/terms" className="body-small" style={{ color: "var(--text-tertiary)" }}>Terms</FooterLink>}
          </div>
        </div>
        </div>
        <div className={styles.mobileCompact}>{compactContent}</div>
      </footer>
      <AdminBar />
    </>
  );
}
