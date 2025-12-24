export declare const ADMIN_COOKIE = "admin_tid";
export declare function isAdmin(telegramId: string): boolean;
export declare function getAdminTelegramIdFromCookie(): string | null;
/**
 * Server-side guard for pages.
 * Throw => Next will render error boundary (ok for now).
 */
export declare function requireAdmin(): {
    telegramId: string;
};
/**
 * Lightweight guard for API routes (better UX than throw).
 */
export declare function requireAdminApi(): {
    ok: true;
    telegramId: string;
} | {
    ok: false;
};
