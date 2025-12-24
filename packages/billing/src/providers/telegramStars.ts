export async function processStarsPayment(input: {
  userId: string;
  amount: number;
}) {
  return {
    success: true,
    creditsAdded: input.amount,
  };
}
