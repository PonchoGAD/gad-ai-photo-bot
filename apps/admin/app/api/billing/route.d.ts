import { NextResponse } from "next/server";
type UserSummary = {
    id: string;
    telegramId: string;
    plan: string;
    credits: number | null;
    isBanned: boolean;
};
export declare function GET(): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    summary: {
        users: number;
        totalCredits: number;
    };
    users: UserSummary[];
}>>;
export {};
