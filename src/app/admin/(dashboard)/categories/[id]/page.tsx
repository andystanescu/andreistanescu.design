import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { CategoryServiceEditor } from "@/components/admin/CategoryServiceEditor/CategoryServiceEditor";
import { getServiceTemplate, type ServiceItem } from "@/lib/serviceItems";
import { CategoryDeleteActions } from "@/components/admin/CategoryDeleteActions/CategoryDeleteActions";

export const dynamic = "force-dynamic";

export default async function EditCategoryPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const { error } = await searchParams;
  const category = db.prepare("SELECT id, name, description FROM categories WHERE id = ?").get(id) as { id: number; name: string; description: string } | undefined;
  if (!category) notFound();
  const service = db.prepare("SELECT * FROM service_items WHERE category_id = ?").get(category.id) as ServiceItem | undefined;
  return <>
    <h1 className="heading-01">Edit category &amp; service</h1>
    {error && <p role="alert" style={{ color: "var(--border-error)" }}>{error}</p>}
    <CategoryServiceEditor category={{ ...category }} service={service ? { ...service } : null} initialTemplate={service ? getServiceTemplate(service) : "custom"} />
    <CategoryDeleteActions id={category.id} name={category.name} hasService={Boolean(service)} />
  </>;
}
