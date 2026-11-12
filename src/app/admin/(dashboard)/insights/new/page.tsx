import { getExistingTags } from "@/lib/existingTags";
import { getCategories } from "@/lib/categories";
import { getSettings } from "@/lib/settings";
import { InsightEditor } from "@/components/admin/InsightEditor/InsightEditor";
import { getRelatedReadingOptions } from "@/lib/relatedReadings";

export default async function NewInsightPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const categories = getCategories().map((category) => ({ id: category.id, title: category.name }));
  const settings = getSettings();
  return <>{error && <p style={{ color: "var(--border-error)" }}>{error}</p>}<InsightEditor existingTags={getExistingTags()} action="/api/admin/insights" categories={categories} settingsAuthor={settings.author_name} relatedReadings={getRelatedReadingOptions()} authorAvatarUrl={settings.about_hero_image} /></>;
}
