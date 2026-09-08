import { getServiceItems } from "@/lib/serviceItems";
import { getSettings } from "@/lib/settings";
import { InsightEditor } from "@/components/admin/InsightEditor/InsightEditor";

export default async function NewInsightPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const categories = getServiceItems().map((service) => ({ id: service.id, title: service.title }));
  const settings = getSettings();
  return <>{error && <p style={{ color: "var(--border-error)" }}>{error}</p>}<InsightEditor action="/api/admin/insights" categories={categories} settingsAuthor={settings.author_name} authorAvatarUrl={settings.about_hero_image} /></>;
}
