import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const service = db.prepare("SELECT category_id FROM service_items WHERE id = ?").get(id) as { category_id: number | null } | undefined;
  if (!service?.category_id) notFound();
  redirect(`/admin/categories/${service.category_id}`);
}
