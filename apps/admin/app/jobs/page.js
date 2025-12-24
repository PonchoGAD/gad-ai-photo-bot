import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { prisma } from "@/lib/prisma";
export default async function JobsPage() {
    const jobs = await prisma.job.findMany({
        orderBy: { createdAt: "desc" },
        take: 50
    });
    return (_jsxs("div", { className: "p-8", children: [_jsx("h2", { className: "text-2xl font-bold mb-6", children: "Jobs" }), _jsx("ul", { className: "space-y-2", children: jobs.map((j) => (_jsxs("li", { className: "border p-3 rounded", children: [_jsx("b", { children: j.type }), " \u2014 ", j.status, j.error && _jsx("div", { className: "text-red-500", children: j.error })] }, j.id))) })] }));
}
//# sourceMappingURL=page.js.map