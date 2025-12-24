// apps/admin/components/Sidebar.tsx
import Link from "next/link";
const NavLink = (props) => (<Link href={props.href} className="block rounded px-3 py-2 hover:bg-white/10 transition">
    {props.label}
  </Link>);
export default function Sidebar() {
    return (<aside className="w-64 bg-black text-white min-h-screen p-6">
      <h1 className="text-xl font-bold mb-8">GAD Admin</h1>
      <nav className="space-y-2 text-sm">
        <NavLink href="/" label="Dashboard"/>
        <NavLink href="/users" label="Users"/>
        <NavLink href="/jobs" label="Jobs"/>
        <NavLink href="/billing" label="Billing"/>
        <NavLink href="/templates" label="Templates"/>
      </nav>
      <div className="mt-10 text-xs text-white/60">
        Admin access via Telegram ID cookie
      </div>
    </aside>);
}
