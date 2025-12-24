export function createPublicId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createJobId() {
  return createPublicId("job");
}

export function createPaymentId() {
  return createPublicId("pay");
}
