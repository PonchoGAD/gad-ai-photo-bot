import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE } from "@/lib/auth";

const ADMINS = (process.env.ADMIN_TELEGRAM_IDS ?? "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const telegramId = body?.telegramId;

  if (!telegramId || !ADMINS.includes(String(telegramId))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  cookies().set({
    name: ADMIN_COOKIE,
    value: String(telegramId),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
  });

  return NextResponse.json({ ok: true });
}
