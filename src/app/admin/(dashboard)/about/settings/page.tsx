import { notFound } from "next/navigation";
import { getPage } from "@/lib/pages";
import { AboutAdminHeader } from "@/components/admin/AboutAdminHeader/AboutAdminHeader";
import { PageSettingsForm } from "@/components/admin/PageSettingsForm/PageSettingsForm";

export const dynamic = "force-dynamic";

export default async function AboutPageSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const page = getPage("about");

  if (!page) {
    notFound();
  }

  return (
    <>
      <AboutAdminHeader active="/admin/about/settings" />
      <PageSettingsForm
        page={page}
        error={error}
        redirect="/admin/about/settings"
        note="The About page itself is built from the Sections/Philosophy/Highlights tabs above — eyebrow, title, and body here aren't shown anywhere. Only the nav label and “show in main nav” actually affect the site (the About link in the header)."
      />
    </>
  );
}
