import { notFound } from "next/navigation";
import { DesignSystemPage } from "@/components/admin/DesignSystem/DesignSystemPage";
import { isDesignSystemSection } from "@/lib/designSystemManifest";

export const dynamic = "force-dynamic";
export default async function Page({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!isDesignSystemSection(section)) notFound();
  return <DesignSystemPage section={section} />;
}
