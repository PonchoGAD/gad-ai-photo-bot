export async function createYooKassaPayment(payload) {
    // Заглушка, НО архитектурно правильная
    // Реальная интеграция делается через backend webhook
    return {
        paymentUrl: `https://yookassa.ru/pay/mock?user=${payload.userId}&amount=${payload.amount}`,
    };
}
//# sourceMappingURL=yookassa.js.map