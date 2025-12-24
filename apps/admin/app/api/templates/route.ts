// apps/admin/app/api/templates/route.ts
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";

export async function GET() {
  const auth = requireAdminApi();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json([
    { id: "minimal-dark", name: "Minimal Dark" }
  ]);
}
