export const PLANS = {
  FREE: {
    credits: 20,
    maxJobsPerDay: 5,
  },
  STARTER: {
    credits: 200,
    maxJobsPerDay: 50,
  },
  PRO: {
    credits: 1000,
    maxJobsPerDay: 500,
  },
  STUDIO: {
    credits: 5000,
    maxJobsPerDay: 5000,
  },
} as const;

export type PlanName = keyof typeof PLANS;

export const JOB_COSTS = {
  CREATE_CARDS: 5,
  ENHANCE: 2,
  BACKGROUND: 2,
  BATCH: 10,
  VIDEO: 20,
} as const;

export type JobType = keyof typeof JOB_COSTS;
