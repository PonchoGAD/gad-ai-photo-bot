import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export async function addCredits(userId, amount, reason) {
    return prisma.user.update({
        where: { id: userId },
        data: {
            credits: { increment: amount }
        }
    });
}
export async function spendCredits(userId, amount) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.credits < amount) {
        throw new Error("Недостаточно кредитов");
    }
    return prisma.user.update({
        where: { id: userId },
        data: {
            credits: { decrement: amount }
        }
    });
}
//# sourceMappingURL=ledger.js.map