import { notFound } from "next/navigation";
import { getPage } from "@/lib/pages";
import { AdminTabs } from "@/components/admin/AdminTabs/AdminTabs";
import { PageSettingsForm } from "@/components/admin/PageSettingsForm/PageSettingsForm";
import { CASE_STUDIES_TABS } from "../../adminTabs";

export const dynamic = "force-dynamic";

export default async function CaseStudiesPageSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const page = getPage("work");

  if (!page) {
    notFound();
  }

  return (
    <>
      <h1 className="heading-01">Case studies</h1>
      <AdminTabs tabs={CASE_STUDIES_TABS} active="/admin/case-studies/settings" />
      <PageSettingsForm
        page={page}
        error={error}
        redirect="/admin/case-studies/settings"
        note="Eyebrow, title, and body appear at the top of /work, above the list."
      />
    </>
  );
}
