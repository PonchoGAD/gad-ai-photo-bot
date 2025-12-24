export type PlanName = "FREE" | "STARTER" | "PRO" | "STUDIO";

export const PLANS: Record<PlanName, {
  monthlyPriceUsd: number;
  monthlyCredits: number;
  maxJobsPerDay: number;
  premiumMultiplier: number; // во сколько раз дороже premium карточки
}> = {
  FREE:    { monthlyPriceUsd: 0,   monthlyCredits: 10,   maxJobsPerDay: 2,  premiumMultiplier: 3 },
  STARTER: { monthlyPriceUsd: 19,  monthlyCredits: 120,  maxJobsPerDay: 20, premiumMultiplier: 3 },
  PRO:     { monthlyPriceUsd: 79,  monthlyCredits: 600,  maxJobsPerDay: 100,premiumMultiplier: 3 },
  STUDIO:  { monthlyPriceUsd: 299, monthlyCredits: 3000, maxJobsPerDay: 500,premiumMultiplier: 2 }
};
