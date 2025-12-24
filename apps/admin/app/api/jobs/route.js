// apps/admin/app/api/jobs/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth";
export async function GET(req) {
    const auth = requireAdminApi();
    if (!auth.ok)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const url = new URL(req.url);
    const take = Math.min(Number(url.searchParams.get("take") ?? 50), 200);
    const skip = Number(url.searchParams.get("skip") ?? 0);
    const status = url.searchParams.get("status");
    const type = url.searchParams.get("type");
    const jobs = await prisma.job.findMany({
        where: {
            ...(status ? { status: status } : {}),
            ...(type ? { type: type } : {})
        },
        orderBy: { createdAt: "desc" },
        skip,
        take
    });
    return NextResponse.json({ items: jobs, skip, take });
}
