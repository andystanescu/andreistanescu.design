import { db } from "@/lib/db";

export type Testimonial = { id: number; testimonial: string; name: string; title_company: string; source: string; published: number; position: number };
export function getTestimonials(publishedOnly = true): Testimonial[] {
  return db.prepare(`SELECT * FROM testimonials ${publishedOnly ? "WHERE published = 1" : ""} ORDER BY position, id`).all() as Testimonial[];
}
