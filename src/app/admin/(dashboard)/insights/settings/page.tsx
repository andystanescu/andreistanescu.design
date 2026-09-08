import { notFound } from "next/navigation";
import { getPage } from "@/lib/pages";
import { AdminTabs } from "@/components/admin/AdminTabs/AdminTabs";
import { PageSettingsForm } from "@/components/admin/PageSettingsForm/PageSettingsForm";
import { INSIGHTS_TABS } from "../../adminTabs";

export const dynamic = "force-dynamic";

export default async function InsightsPageSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const page = getPage("insights");

  if (!page) {
    notFound();
  }

  return (
    <>
      <h1 className="heading-01">Insights</h1>
      <AdminTabs tabs={INSIGHTS_TABS} active="/admin/insights/settings" />
      <PageSettingsForm
        page={page}
        error={error}
        redirect="/admin/insights/settings"
        note="Eyebrow, title, and body appear at the top of /insights, above the article list."
      />
    </>
  );
}
