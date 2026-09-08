import { relativeRedirect } from "@/lib/relativeRedirect";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const form = await request.formData();
  const values = ["start_date", "end_date", "job_title", "company_name", "business_profile", "description"].map((key) => String(form.get(key) ?? "").trim());
  if (!values[0] || !values[2] || !values[3] || !values[4] || !values[5]) return relativeRedirect(`/admin/about-experiences/${id}`);
  db.prepare("UPDATE about_experiences SET start_date=?,end_date=?,job_title=?,company_name=?,business_profile=?,description=?,published=? WHERE id=?").run(...values, form.get("published") ? 1 : 0, id);
  return relativeRedirect("/admin/about-experiences");
}
