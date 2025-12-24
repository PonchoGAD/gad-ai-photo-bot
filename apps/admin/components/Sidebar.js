import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
export default function Sidebar() {
    return (_jsxs("aside", { className: "w-64 bg-black text-white min-h-screen p-6", children: [_jsx("h1", { className: "text-xl font-bold mb-8", children: "GAD Admin" }), _jsxs("nav", { className: "space-y-4", children: [_jsx(Link, { href: "/users", children: "Users" }), _jsx(Link, { href: "/jobs", children: "Jobs" }), _jsx(Link, { href: "/billing", children: "Billing" }), _jsx(Link, { href: "/templates", children: "Templates" })] })] }));
}
//# sourceMappingURL=Sidebar.js.map