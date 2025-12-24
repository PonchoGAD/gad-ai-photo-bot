export type YooKassaPayment = {
    amount: number;
    currency: "RUB";
    description: string;
    userId: string;
};
export declare function createYooKassaPayment(payload: YooKassaPayment): Promise<{
    paymentUrl: string;
}>;
//# sourceMappingURL=yookassa.d.ts.map