import { notFound } from "next/navigation";
import { getPage } from "@/lib/pages";
import { AdminTabs } from "@/components/admin/AdminTabs/AdminTabs";
import { PageSettingsForm } from "@/components/admin/PageSettingsForm/PageSettingsForm";
import { SERVICES_TABS } from "../../adminTabs";

export const dynamic = "force-dynamic";

export default async function ServicesPageSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const page = getPage("services");

  if (!page) {
    notFound();
  }

  return (
    <>
      <h1 className="heading-01">Services</h1>
      <AdminTabs tabs={SERVICES_TABS} active="/admin/services/settings" />
      <PageSettingsForm
        page={page}
        error={error}
        redirect="/admin/services/settings"
        note="Eyebrow, title, and body appear at the top of /services, above the list."
      />
    </>
  );
}
