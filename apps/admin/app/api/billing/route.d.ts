import { NextResponse } from "next/server";
export declare function GET(): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    summary: {
        users: number;
        totalCredits: number;
    };
    users: {
        id: string;
        telegramId: string;
        plan: import("@prisma/client").$Enums.Plan;
        credits: number;
        isBanned: boolean;
    }[];
}>>;
