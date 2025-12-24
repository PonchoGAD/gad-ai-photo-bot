import { PLANS } from "./plans.js";
export function enforceCredits(plan, credits, required) {
    if (credits < required) {
        throw new Error("Недостаточно кредитов. Обновите тариф.");
    }
}
export function enforceJob(credits, cost) {
    if (credits < cost) {
        throw new Error("Недостаточно кредитов");
    }
}
//# sourceMappingURL=enforce.js.map