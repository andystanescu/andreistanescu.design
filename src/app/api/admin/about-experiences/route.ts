import { relativeRedirect } from "@/lib/relativeRedirect";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const values = ["start_date", "end_date", "job_title", "company_name", "business_profile", "description"].map((key) => String(form.get(key) ?? "").trim());
  if (!values[0] || !values[2] || !values[3] || !values[4] || !values[5]) return relativeRedirect("/admin/about-experiences/new");
  const position = (db.prepare("SELECT COALESCE(MAX(position), -1) AS max FROM about_experiences").get() as { max: number }).max + 1;
  db.prepare("INSERT INTO about_experiences (start_date,end_date,job_title,company_name,business_profile,description,position,published) VALUES (?,?,?,?,?,?,?,?)").run(...values, position, form.get("published") ? 1 : 0);
  return relativeRedirect("/admin/about-experiences");
}
