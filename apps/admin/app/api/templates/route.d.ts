import { NextResponse } from "next/server";
export declare function GET(): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    id: string;
    name: string;
}[]>>;
