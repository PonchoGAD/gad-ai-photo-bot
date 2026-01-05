import { NextResponse } from "next/server";
export declare function GET(req: Request): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    items: {
        telegramId: string;
        id: string;
        username: string | null;
        createdAt: Date;
        plan: import("@prisma/client").$Enums.Plan;
        credits: number;
        isBanned: boolean;
    }[];
    skip: number;
    take: number;
}>>;
