import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { prisma } from "@/lib/prisma";
export default async function UsersPage() {
    const users = await prisma.user.findMany();
    return (_jsxs("div", { className: "p-8", children: [_jsx("h2", { className: "text-2xl font-bold mb-6", children: "Users" }), _jsxs("table", { className: "w-full border", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "ID" }), _jsx("th", { children: "Telegram" }), _jsx("th", { children: "Plan" }), _jsx("th", { children: "Credits" })] }) }), _jsx("tbody", { children: users.map((u) => (_jsxs("tr", { children: [_jsx("td", { children: u.id }), _jsx("td", { children: u.telegramId }), _jsx("td", { children: u.plan }), _jsx("td", { children: u.credits })] }, u.id))) })] })] }));
}
//# sourceMappingURL=page.js.map