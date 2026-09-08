import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import type { Insight } from "@/data/insights";
import { getServiceItems } from "@/lib/serviceItems";
import { getSettings } from "@/lib/settings";
import { InsightEditor } from "@/components/admin/InsightEditor/InsightEditor";

export const dynamic = "force-dynamic";

export default async function EditInsightPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const { error } = await searchParams;
  const insight = db.prepare("SELECT * FROM insights WHERE id = ?").get(id) as Insight | undefined;
  if (!insight) notFound();
  const categories = getServiceItems().map((service) => ({ id: service.id, title: service.title }));
  const clientInsight = { ...insight };
  const settings = getSettings();
  return <>{error && <p style={{ color: "var(--border-error)" }}>{error}</p>}<InsightEditor action={`/api/admin/insights/${insight.id}`} categories={categories} settingsAuthor={settings.author_name} authorAvatarUrl={settings.about_hero_image} insight={clientInsight} /></>;
}
