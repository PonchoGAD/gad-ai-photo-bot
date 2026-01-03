// apps/admin/app/billing/page.tsx
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

type AdminUser = {
  id: string;
  telegramId: string;
  plan: string;
  credits: number | null;
  isBanned: boolean;
};


export default async function BillingPage() {
  requireAdmin();

  const users: AdminUser[] = await prisma.user.findMany({
    orderBy: { credits: "desc" },
    take: 200
  });

  const sumCredits = await prisma.user.aggregate({
    _sum: { credits: true }
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Billing</h2>

      <div className="border border-white/10 rounded p-4 bg-white/5">
        Total credits in system: <b>{sumCredits._sum.credits ?? 0}</b>
      </div>

      <div className="space-y-2">
        {users.map((u: AdminUser) => (
          <div
            key={u.id}
            className="border border-white/10 rounded p-3 bg-white/5"
          >
            <div className="text-sm text-white/60">User</div>
            <div className="font-semibold">{u.telegramId}</div>
            <div className="text-sm mt-2">
              Plan: <b>{u.plan}</b> • Credits: <b>{u.credits}</b> • Banned:{" "}
              <b>{u.isBanned ? "yes" : "no"}</b>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
