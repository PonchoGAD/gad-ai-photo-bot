// apps/admin/app/api/users/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth";

export async function GET(req: Request) {
  const auth = requireAdminApi();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const take = Math.min(Number(url.searchParams.get("take") ?? 50), 200);
  const skip = Number(url.searchParams.get("skip") ?? 0);

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    skip,
    take,
    select: {
      id: true,
      telegramId: true,
      username: true,
      plan: true,
      credits: true,
      isBanned: true,
      createdAt: true
    }
  });

  return NextResponse.json({ items: users, skip, take });
}
