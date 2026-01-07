// apps/admin/lib/auth.ts
import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";



export const ADMIN_COOKIE = "admin_tid";

const ADMINS = (process.env.ADMIN_TELEGRAM_IDS ?? "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

export function isAdmin(telegramId: string) {
  if (!telegramId) return false;
  return ADMINS.includes(String(telegramId));
}

export function getAdminTelegramIdFromCookie(): string | null {
  const cookie = cookies().get(ADMIN_COOKIE);
  if (!cookie?.value) return null;
  return cookie.value;
}

/**
 * Server-side guard for pages.
 * Throw => Next will render error boundary (ok for now).
 */
export function requireAdmin() {
  const tid = getAdminTelegramIdFromCookie();
  if (!tid || !isAdmin(tid)) {
    // In development allow a bypass to avoid SSR crashes when no cookie is present.
    // Use `DEV_ADMIN_TID` env or first value from `ADMIN_TELEGRAM_IDS` if available.
    if (process.env.NODE_ENV !== "production") {
      const devTid = process.env.DEV_ADMIN_TID ?? ADMINS[0] ?? null;
      if (devTid) return { telegramId: String(devTid) };
    }

    // Redirect to login instead of throwing an Error to avoid SSR crash.
    redirect("/login");
  }

  return { telegramId: tid };
}

/**
 * Lightweight guard for API routes (better UX than throw).
 */
export function requireAdminApi(): { ok: true; telegramId: string } | { ok: false } {
  const tid = getAdminTelegramIdFromCookie();
  if (!tid || !isAdmin(tid)) return { ok: false };
  return { ok: true, telegramId: tid };
}
