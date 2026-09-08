import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import type { AboutExperience } from "@/lib/about";
import { ExperienceForm } from "@/components/admin/ExperienceForm/ExperienceForm";

export const dynamic = "force-dynamic";

export default async function EditAboutExperiencePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = db.prepare("SELECT * FROM about_experiences WHERE id = ?").get(id) as AboutExperience | undefined;
  if (!item) notFound();
  return <><h1 className="heading-01">Edit experience</h1><ExperienceForm action={`/api/admin/about-experiences/${item.id}`} item={item} /></>;
}
