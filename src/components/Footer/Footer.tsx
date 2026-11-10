import { Logo } from "@/components/Logo/Logo";
import { Button } from "@/components/Button/Button";
import { ArrowIcon } from "@/components/Icon/ArrowIcon";
import { FooterLink } from "./FooterLink";
import { getServiceItems } from "@/lib/serviceItems";
import { getSettings } from "@/lib/settings";
import { getNavLinks, getPublishedPage } from "@/lib/pages";
import styles from "./Footer.module.css";

type FooterProps = {
  variant?: "full" | "compact";
  hideContactCta?: boolean;
};

export function Footer({
  variant = "full",
  hideContactCta = false,
}: FooterProps) {
  const navigationLinks = getNavLinks();
  const settings = getSettings();
  const actionLabel = settings.footer_contact_label || "Let's talk";
  const services = getServiceItems();
  const privacyPage = getPublishedPage("privacy");
  const termsPage = getPublishedPage("terms");
  const resolvedContactPrompt = settings.footer_contact_message;
  const compactContent = (
    <div className={`container ${styles.compactInner}`}>
      {!hideContactCta && settings.footer_show_contact === "1" && (
        <div className={styles.compactPrompt}>
          <p className="body-large">{resolvedContactPrompt}</p>
          <FooterLink href="/contact" className={styles.compactCta}>{actionLabel} <span aria-hidden="true">→</span></FooterLink>
        </div>
      )}
      {(settings.footer_show_navigation === "1" || settings.footer_show_services === "1") && <nav className={styles.compactLinks} aria-label="Footer navigation">
        {settings.footer_show_navigation === "1" && <><FooterLink href="/work">Work</FooterLink><FooterLink href="/insights">Articles</FooterLink><FooterLink href="/about">About</FooterLink></>}
        {settings.footer_show_services === "1" && <FooterLink href="/services">Services</FooterLink>}
      </nav>}
      <p className={styles.compactCopyright}>© {settings.footer_copyright}</p>
    </div>
  );

  if (variant === "compact") {
    return (
      <>
        <footer className={`${styles.footer} ${styles.compactFooter} section-dark`}>
          {compactContent}
        </footer>
      </>
    );
  }

  return (
    <>
      <footer className={`${styles.footer} section-dark`}>
        <div className={`container ${styles.footerInner}`}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <Logo variant="primary" theme="inverted" identity={settings.logo_identity} imageUrl={settings.logo_image} />
            <p className="body-small" style={{ color: "var(--text-secondary)" }}>
              {settings.footer_message}
            </p>
          </div>

          <div className={styles.linksGroup}>
            {settings.footer_show_services === "1" && <div className={styles.column}>
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
            </div>}

            {settings.footer_show_navigation === "1" && <div className={styles.column}>
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
            </div>}

            {!hideContactCta && settings.footer_show_contact === "1" && (
              <div className={styles.connect}>
                <p className="label-small">{settings.footer_contact_title}</p>
                <p className="body-small" style={{ color: "var(--text-secondary)" }}>
                  {resolvedContactPrompt}
                </p>
                <Button href="/contact" icon={<ArrowIcon size={16} />}>
                  {actionLabel}
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.bottom}>
          <p className="body-small" style={{ color: "var(--text-tertiary)" }}>
            © {settings.footer_copyright}
          </p>
          <div className={styles.legal}>
            {privacyPage && <FooterLink href="/privacy" className="body-small" style={{ color: "var(--text-tertiary)" }}>Privacy</FooterLink>}
            {termsPage && <FooterLink href="/terms" className="body-small" style={{ color: "var(--text-tertiary)" }}>Terms</FooterLink>}
          </div>
        </div>
        </div>
        <div className={styles.mobileCompact}>{compactContent}</div>
      </footer>
    </>
  );
}
