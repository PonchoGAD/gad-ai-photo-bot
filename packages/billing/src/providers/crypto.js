import { addCredits } from "../ledger.js";
export async function processUsdtPayment(userId, amountUsd, txHash) {
    if (amountUsd >= 19) {
        await addCredits(userId, 120, "USDT STARTER");
    }
    if (amountUsd >= 79) {
        await addCredits(userId, 600, "USDT PRO");
    }
    if (amountUsd >= 299) {
        await addCredits(userId, 3000, "USDT STUDIO");
    }
}
//# sourceMappingURL=crypto.js.map