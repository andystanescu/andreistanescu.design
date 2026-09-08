import { notFound } from "next/navigation";
import { getPage } from "@/lib/pages";
import { AdminTabs } from "@/components/admin/AdminTabs/AdminTabs";
import { PageSettingsForm } from "@/components/admin/PageSettingsForm/PageSettingsForm";
import { APPROACH_TABS } from "../../adminTabs";

export const dynamic = "force-dynamic";

export default async function ApproachPageSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const page = getPage("approach");

  if (!page) {
    notFound();
  }

  return (
    <>
      <h1 className="heading-01">Approach steps</h1>
      <AdminTabs tabs={APPROACH_TABS} active="/admin/approach-steps/settings" />
      <PageSettingsForm
        page={page}
        error={error}
        redirect="/admin/approach-steps/settings"
        note="These settings now control the How I work section on /about#how-i-work. The Approach admin section remains the place to manage its content."
      />
    </>
  );
}
