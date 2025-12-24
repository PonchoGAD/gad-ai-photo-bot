import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { prisma } from "@/lib/prisma";
export default async function BillingPage() {
    const users = await prisma.user.findMany();
    return (_jsxs("div", { className: "p-8", children: [_jsx("h2", { className: "text-2xl font-bold mb-6", children: "Billing" }), users.map((u) => (_jsxs("div", { className: "border p-4 mb-2", children: [_jsxs("div", { children: ["User: ", u.telegramId] }), _jsxs("div", { children: ["Plan: ", u.plan] }), _jsxs("div", { children: ["Credits: ", u.credits] })] }, u.id)))] }));
}
//# sourceMappingURL=page.js.map