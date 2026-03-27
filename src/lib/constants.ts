import { PlanType } from "@/lib/types";

export const APP_NAME = "Birdie for Good";

export const PLAN_PRICING: Record<PlanType, number> = {
  monthly: 29,
  yearly: 299,
};

export const MIN_CHARITY_PERCENT = 10;
export const PRIZE_POOL_CONTRIBUTION_PERCENT = 45;

export const PRIZE_SPLIT = {
  5: 0.4,
  4: 0.35,
  3: 0.25,
} as const;

export const SCORE_MIN = 1;
export const SCORE_MAX = 45;

export const JWT_COOKIE_NAME = "dh_session";
