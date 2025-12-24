export declare const PLANS: {
    readonly FREE: {
        readonly credits: 20;
        readonly maxJobsPerDay: 5;
    };
    readonly STARTER: {
        readonly credits: 200;
        readonly maxJobsPerDay: 50;
    };
    readonly PRO: {
        readonly credits: 1000;
        readonly maxJobsPerDay: 500;
    };
    readonly STUDIO: {
        readonly credits: 5000;
        readonly maxJobsPerDay: 5000;
    };
};
export type PlanName = keyof typeof PLANS;
export declare const JOB_COSTS: {
    readonly CREATE_CARDS: 5;
    readonly ENHANCE: 2;
    readonly BACKGROUND: 2;
    readonly BATCH: 10;
    readonly VIDEO: 20;
};
export type JobType = keyof typeof JOB_COSTS;
//# sourceMappingURL=constants.d.ts.map