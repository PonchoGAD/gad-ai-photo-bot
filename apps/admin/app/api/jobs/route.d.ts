import { NextResponse } from "next/server";
export declare function GET(req: Request): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    items: any;
    skip: number;
    take: number;
}>>;
