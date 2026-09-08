import { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { relativeRedirect } from "@/lib/relativeRedirect";

export async function POST(request: NextRequest) {
  const response = relativeRedirect("/admin/login");
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
