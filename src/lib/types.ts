export type UserRole = "subscriber" | "admin";

export type PlanType = "monthly" | "yearly";

export type DrawMode = "random" | "algorithmic";

export type WinnerTier = 3 | 4 | 5;

export type WinnerStatus = "pending" | "approved" | "rejected";

export type PayoutStatus = "pending" | "paid";

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: PlanType;
  status: "active" | "inactive" | "lapsed" | "cancelled";
  renewalDate: string;
  charityId: string;
  charityPercent: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  cancelAtPeriodEnd?: boolean;
  lastPaymentAt?: string;
  lastPaymentStatus?: "paid" | "pending" | "failed";
  createdAt: string;
}

export interface ScoreEntry {
  id: string;
  userId: string;
  value: number;
  date: string;
  createdAt: string;
}

export interface Charity {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  featured: boolean;
  tags: string[];
  events: string[];
  createdAt: string;
}

export interface Draw {
  id: string;
  monthKey: string;
  mode: DrawMode;
  numbers: number[];
  isSimulation: boolean;
  published: boolean;
  executedAt: string;
  jackpotCarryIn: number;
  jackpotCarryOut: number;
  prizePoolTotal: number;
}

export interface Winner {
  id: string;
  drawId: string;
  userId: string;
  tier: WinnerTier;
  matches: number;
  amount: number;
  status: WinnerStatus;
  payoutStatus: PayoutStatus;
  proofUrl?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}


