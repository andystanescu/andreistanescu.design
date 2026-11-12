import { relativeRedirect } from "@/lib/relativeRedirect";

// New services are enabled on their category rather than created separately.
export async function POST() {
  return relativeRedirect("/admin/categories");
}
