export type YooKassaPayment = {
  amount: number;
  currency: "RUB";
  description: string;
  userId: string;
};

export async function createYooKassaPayment(
  payload: YooKassaPayment
): Promise<{ paymentUrl: string }> {
  // Заглушка, НО архитектурно правильная
  // Реальная интеграция делается через backend webhook

  return {
    paymentUrl: `https://yookassa.ru/pay/mock?user=${payload.userId}&amount=${payload.amount}`,
  };
}
