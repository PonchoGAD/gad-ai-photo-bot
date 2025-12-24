// apps/admin/lib/auth.ts
import { cookies } from "next/headers";
export const ADMIN_COOKIE = "admin_tid";
const ADMINS = (process.env.ADMIN_TELEGRAM_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
export function isAdmin(telegramId) {
    if (!telegramId)
        return false;
    return ADMINS.includes(String(telegramId));
}
export function getAdminTelegramIdFromCookie() {
    const cookie = cookies().get(ADMIN_COOKIE);
    if (!cookie?.value)
        return null;
    return cookie.value;
}
/**
 * Server-side guard for pages.
 * Throw => Next will render error boundary (ok for now).
 */
export function requireAdmin() {
    const tid = getAdminTelegramIdFromCookie();
    if (!tid || !isAdmin(tid)) {
        throw new Error("Unauthorized");
    }
    return { telegramId: tid };
}
/**
 * Lightweight guard for API routes (better UX than throw).
 */
export function requireAdminApi() {
    const tid = getAdminTelegramIdFromCookie();
    if (!tid || !isAdmin(tid))
        return { ok: false };
    return { ok: true, telegramId: tid };
}
