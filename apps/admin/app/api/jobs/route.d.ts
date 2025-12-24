import { NextResponse } from "next/server";
export declare function GET(req: Request): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    items: {
        error: string | null;
        status: import("@prisma/client").$Enums.JobStatus;
        id: string;
        createdAt: Date;
        userId: string;
        type: import("@prisma/client").$Enums.JobType;
        inputJson: import("@prisma/client/runtime/library").JsonValue;
        outputJson: import("@prisma/client/runtime/library").JsonValue | null;
        tgMessageId: number | null;
        tgDeliveredAt: Date | null;
        tgDeliveryStatus: string | null;
        tgDeliveryError: string | null;
        updatedAt: Date;
    }[];
    skip: number;
    take: number;
}>>;
