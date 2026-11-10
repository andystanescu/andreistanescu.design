import EditPagePage from "../pages/[slug]/page";

export const dynamic = "force-dynamic";

export default function AdminPrivacyPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  return <EditPagePage params={Promise.resolve({ slug: "privacy" })} searchParams={searchParams} />;
}
