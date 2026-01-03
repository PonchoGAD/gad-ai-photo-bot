// apps/admin/app/users/page.tsx
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

type AdminUser = {
  id: string;
  telegramId: string;
  username: string | null;
  plan: string;
  credits: number | null;
  isBanned: boolean;
};

export default async function UsersPage() {
  requireAdmin();

  const users: AdminUser[] = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 200
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Users</h2>

      <div className="overflow-auto border border-white/10 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="px-3 py-2 text-left">ID</th>
              <th className="px-3 py-2 text-left">Telegram</th>
              <th className="px-3 py-2 text-left">Username</th>
              <th className="px-3 py-2 text-left">Plan</th>
              <th className="px-3 py-2 text-left">Credits</th>
              <th className="px-3 py-2 text-left">Banned</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-white/10">
                <td className="px-3 py-2">{u.id}</td>
                <td className="px-3 py-2">{u.telegramId}</td>
                <td className="px-3 py-2">{u.username ?? "-"}</td>
                <td className="px-3 py-2">{u.plan}</td>
                <td className="px-3 py-2">{u.credits ?? 0}</td>
                <td className="px-3 py-2">{u.isBanned ? "yes" : "no"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
