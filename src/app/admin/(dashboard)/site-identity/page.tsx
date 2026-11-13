import { getSettings } from "@/lib/settings";
import { SiteIdentityEditor } from "@/components/admin/SiteIdentityEditor/SiteIdentityEditor";
import { parsePublishedTheme } from "@/lib/themePalette";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

export default async function AdminSiteIdentityPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const query = await searchParams;
  const settings = getSettings();
  const publishedTheme = settings.theme_config ? parsePublishedTheme(settings.theme_config) : null;
  const anchors = publishedTheme?.anchors;
  return <>
    <div className={`${styles.pageHeader} ${styles.pageHeaderStacked}`}>
      <h1 className="heading-01">Site identity</h1>
      <p className={`body-small ${styles.helper}`}>Manage the visual identity shared across the public site: logo and generated theme palettes.</p>
    </div>
    <SiteIdentityEditor
      logoImage={settings.logo_image}
      logoIconImage={settings.logo_icon_image}
      logoIdentity={settings.logo_identity}
      logoColorMapping={settings.logo_color_mapping}
      iconColorMapping={settings.logo_icon_color_mapping}
      overrides={publishedTheme?.overrides}
      colors={{
        theme_primary_500: anchors?.primary ?? settings.theme_primary_500,
        theme_secondary_500: anchors?.secondary ?? settings.theme_secondary_500,
        theme_accent_500: anchors?.accent ?? settings.theme_accent_500,
        theme_neutral_500: anchors?.neutral ?? settings.theme_neutral_500,
      }}
      saved={query.saved ?? ""}
      error={query.error}
    />
  </>;
}
