// apps/admin/app/api/billing/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth";

type UserSummary = {
  id: string;
  telegramId: string;
  plan: string;
  credits: number | null;
  isBanned: boolean;
};

export async function GET() {
  const auth = requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users: UserSummary[] = await prisma.user.findMany({
    select: {
      id: true,
      telegramId: true,
      plan: true,
      credits: true,
      isBanned: true
    }
  });

  const totalCredits = users.reduce(
    (acc: number, u: UserSummary) => acc + (u.credits ?? 0),
    0
  );

  return NextResponse.json({
    summary: {
      users: users.length,
      totalCredits
    },
    users
  });
}
