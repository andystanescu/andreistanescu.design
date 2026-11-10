import Link from "next/link";
import { AdminIcon } from "@/components/admin/AdminIcon/AdminIcon";
import { getGenericPages, getMainNavPages, getNavLinks, getPublishedPage, RELOCATED_PAGE_SLUGS } from "@/lib/pages";
import { NavigationPreview } from "@/components/admin/NavigationPreview/NavigationPreview";
import { FooterEditor } from "@/components/admin/FooterEditor/FooterEditor";
import { getSettings } from "@/lib/settings";
import { getServiceItems } from "@/lib/serviceItems";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

export default async function AdminPagesPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const query = await searchParams;
  const settings = getSettings();
  const pages = getGenericPages();
  const navPages = getMainNavPages().filter((page) => page.visible && page.slug !== "approach");
  const otherPages = pages.filter((page) => !page.show_in_nav);

  function editHref(slug: string) {
    return RELOCATED_PAGE_SLUGS.has(slug)
      ? `/admin/${slug}/settings`
      : `/admin/pages/${slug}`;
  }

  return (
    <>
      <div className={`${styles.pageHeader} ${styles.pageHeaderStacked}`}>
        <h1 className="heading-01">Navigation</h1>
        <p className={`body-small ${styles.helper}`}>
          Arrange the public navigation in the preview. Use each page&apos;s settings to change its label or whether it appears in the navigation.
        </p>
      </div>
      <NavigationPreview items={navPages.map((page) => ({ id: page.slug, label: page.nav_label || page.title }))} logoIdentity={settings.logo_identity} logoImage={settings.logo_image} logoIconImage={settings.logo_icon_image} initialStyle={settings.navigation_style} />

      <div className={styles.pageColumns}>
        {otherPages.length > 0 && <section className={styles.pageColumn}>
          <h2 className="heading-02">Other pages</h2>
          <p className={`body-small ${styles.helper}`}>
            Pages that are not currently part of the public main navigation.
          </p>
          <ul className={styles.list}>
            {otherPages.map((page) => (
              <li key={page.slug} className={styles.listItem}>
                <div className={styles.listItemMeta}>
                  <p className="body-default">{page.title}</p>
                  <p className="body-small" style={{ color: "var(--text-tertiary)" }}>/{page.slug}</p>
                </div>
                <div className={styles.listItemActions}>
                  <Link href={editHref(page.slug)} className={styles.editLink}>
                    <AdminIcon name="action-edit" /><span className={styles.srOnly}>Edit page</span>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>}
      </div>
      {query.saved === "footer" && <p role="status" className="body-small">Footer settings saved.</p>}
      <FooterEditor initial={{ message: settings.footer_message, services: settings.footer_show_services === "1", navigation: settings.footer_show_navigation === "1", contact: settings.footer_show_contact === "1", label: settings.footer_contact_label, copyright: settings.footer_copyright, contactTitle: settings.footer_contact_title, contactMessage: settings.footer_contact_message }} logoIdentity={settings.logo_identity} logoImage={settings.logo_image} services={getServiceItems().map((item) => item.title)} navigation={getNavLinks().map((item) => item.label)} legal={[...(getPublishedPage("privacy") ? ["Privacy"] : []), ...(getPublishedPage("terms") ? ["Terms"] : [])]} />
    </>
  );
}
