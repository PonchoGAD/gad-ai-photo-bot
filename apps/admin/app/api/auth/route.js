// apps/admin/app/api/auth/route.ts
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { ADMIN_COOKIE } from "@/lib/auth";
export async function POST(req) {
    let body = null;
    try {
        body = await req.json();
    }
    catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const telegramId = String(body?.telegramId ?? "").trim();
    if (!telegramId) {
        return NextResponse.json({ error: "telegramId required" }, { status: 400 });
    }
    if (!isAdmin(telegramId)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE, telegramId, {
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30 // 30 days
    });
    return res;
}
export async function DELETE() {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE, "", {
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 0
    });
    return res;
}
