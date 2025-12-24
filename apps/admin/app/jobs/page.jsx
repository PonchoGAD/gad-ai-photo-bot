// apps/admin/app/jobs/page.tsx
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
export default async function JobsPage() {
    requireAdmin();
    const jobs = await prisma.job.findMany({
        orderBy: { createdAt: "desc" },
        take: 100
    });
    return (<div className="space-y-6">
      <h2 className="text-2xl font-bold">Jobs</h2>

      <div className="space-y-2">
        {jobs.map((j) => (<div key={j.id} className="border border-white/10 rounded p-3 bg-white/5">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{j.type}</div>
              <div className="text-xs text-white/60">{new Date(j.createdAt).toLocaleString()}</div>
            </div>
            <div className="text-sm mt-1">
              Status: <b>{j.status}</b>
            </div>
            {j.error && <div className="text-sm text-red-400 mt-2">{j.error}</div>}
          </div>))}
      </div>
    </div>);
}
