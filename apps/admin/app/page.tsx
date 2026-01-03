// apps/admin/app/page.tsx
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/StatCard";
import { requireAdmin } from "@/lib/auth";

type AdminJob = {
  id: string;
  type: string;
  status: string;
  error: string | null;
  createdAt: Date;
};


export default async function AdminHome() {
  requireAdmin();

  const [usersCount, jobsCount] = await Promise.all([
    prisma.user.count(),
    prisma.job.count()
  ]);

  const lastJobs: AdminJob[] = await prisma.job.findMany({
    orderBy: { createdAt: "desc" },
    take: 10
  });

  const sumCredits = await prisma.user.aggregate({
    _sum: { credits: true }
  });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Users" value={usersCount} />
        <StatCard title="Jobs" value={jobsCount} />
        <StatCard title="Total credits" value={sumCredits._sum.credits ?? 0} />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Last jobs</h2>
        <div className="space-y-2">
          {lastJobs.map((j: AdminJob) => (
            <div
              key={j.id}
              className="border border-white/10 rounded p-3 bg-white/5"
            >
              <div className="font-semibold">{j.type}</div>
              <div className="text-xs text-white/60">
                {j.status} • {new Date(j.createdAt).toLocaleString()}
              </div>
              {j.error && (
                <div className="text-xs text-red-400 mt-2">{j.error}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
