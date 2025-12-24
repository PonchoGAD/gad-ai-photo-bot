import { NextResponse } from "next/server";
export declare function POST(req: Request): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    ok: boolean;
}>>;
export declare function DELETE(): Promise<NextResponse<{
    ok: boolean;
}>>;
