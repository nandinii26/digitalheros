import { hashPassword, verifyPassword } from "@/lib/auth";
import {
  MIN_CHARITY_PERCENT,
  PLAN_PRICING,
  PRIZE_POOL_CONTRIBUTION_PERCENT,
  PRIZE_SPLIT,
  SCORE_MAX,
  SCORE_MIN,
} from "@/lib/constants";
import type {
  Charity,
  Draw,
  DrawMode,
  PlanType,
  ScoreEntry,
  SessionUser,
  Subscription,
  User,
  Winner,
  WinnerTier,
} from "@/lib/types";

function nowIso() {
  return new Date().toISOString();
}

function getMonthKey(date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function nextRenewal(plan: PlanType): string {
  const date = new Date();
  if (plan === "monthly") {
    date.setUTCMonth(date.getUTCMonth() + 1);
  } else {
    date.setUTCFullYear(date.getUTCFullYear() + 1);
  }
  return date.toISOString();
}

function uuid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 11)}`;
}

function pickUniqueRandomNumbers(count: number, min: number, max: number): number[] {
  const values = new Set<number>();
  while (values.size < count) {
    values.add(Math.floor(Math.random() * (max - min + 1)) + min);
  }
  return Array.from(values).sort((a, b) => a - b);
}

function getWeightedNumbers(count: number, sourceScores: number[]): number[] {
  const freq = new Map<number, number>();
  for (const score of sourceScores) {
    freq.set(score, (freq.get(score) || 0) + 1);
  }

  const pool: number[] = [];
  for (let value = SCORE_MIN; value <= SCORE_MAX; value += 1) {
    const weight = (freq.get(value) || 1) * 2;
    for (let i = 0; i < weight; i += 1) {
      pool.push(value);
    }
  }

  const selected = new Set<number>();
  while (selected.size < count) {
    selected.add(pool[Math.floor(Math.random() * pool.length)]);
  }

  return Array.from(selected).sort((a, b) => a - b);
}

interface Db {
  users: User[];
  subscriptions: Subscription[];
  scores: ScoreEntry[];
  charities: Charity[];
  draws: Draw[];
  winners: Winner[];
  jackpotRollover: number;
}

const db: Db = {
  users: [
    {
      id: "user_admin",
      name: "Admin",
      email: "admin@birdieforgood.com",
      passwordHash: hashPassword("Admin123!"),
      role: "admin",
      createdAt: nowIso(),
    },
    {
      id: "user_demo",
      name: "Demo Golfer",
      email: "demo@birdieforgood.com",
      passwordHash: hashPassword("Demo123!"),
      role: "subscriber",
      createdAt: nowIso(),
    },
  ],
  subscriptions: [
    {
      id: "sub_demo",
      userId: "user_demo",
      plan: "monthly",
      status: "active",
      renewalDate: nextRenewal("monthly"),
      charityId: "charity_1",
      charityPercent: 15,
      createdAt: nowIso(),
    },
  ],
  scores: [
    { id: uuid("score"), userId: "user_demo", value: 28, date: "2026-03-20", createdAt: nowIso() },
    { id: uuid("score"), userId: "user_demo", value: 33, date: "2026-03-12", createdAt: nowIso() },
    { id: uuid("score"), userId: "user_demo", value: 25, date: "2026-03-06", createdAt: nowIso() },
    { id: uuid("score"), userId: "user_demo", value: 30, date: "2026-02-22", createdAt: nowIso() },
    { id: uuid("score"), userId: "user_demo", value: 27, date: "2026-02-16", createdAt: nowIso() },
  ],
  charities: [
    {
      id: "charity_1",
      name: "Junior Fairway Futures",
      description: "Funding youth access to golf, mentorship, and life skills.",
      imageUrl: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=1200&q=80",
      featured: true,
      tags: ["youth", "education"],
      events: ["Spring Golf Day", "Mentor Scramble"],
      createdAt: nowIso(),
    },
    {
      id: "charity_2",
      name: "Greens for Recovery",
      description: "Wellbeing and mental health support through community sports.",
      imageUrl: "https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?auto=format&fit=crop&w=1200&q=80",
      featured: false,
      tags: ["health", "community"],
      events: ["Recovery Open", "Community Putting League"],
      createdAt: nowIso(),
    },
    {
      id: "charity_3",
      name: "Fair Shot Foundation",
      description: "Inclusive golf programs for people with disabilities.",
      imageUrl: "https://images.unsplash.com/photo-1592919505780-303950717480?auto=format&fit=crop&w=1200&q=80",
      featured: false,
      tags: ["inclusion", "accessibility"],
      events: ["Adaptive Golf Clinic"],
      createdAt: nowIso(),
    },
  ],
  draws: [],
  winners: [],
  jackpotRollover: 0,
};

export function listCharities(search?: string): Charity[] {
  if (!search) return db.charities;
  const q = search.toLowerCase();
  return db.charities.filter(
    (charity) =>
      charity.name.toLowerCase().includes(q) ||
      charity.description.toLowerCase().includes(q) ||
      charity.tags.some((tag) => tag.toLowerCase().includes(q)),
  );
}

export function upsertCharity(input: Partial<Charity> & Pick<Charity, "name" | "description">): Charity {
  if (input.id) {
    const found = db.charities.find((charity) => charity.id === input.id);
    if (!found) {
      throw new Error("Charity not found");
    }
    Object.assign(found, input);
    return found;
  }

  const charity: Charity = {
    id: uuid("charity"),
    name: input.name,
    description: input.description,
    imageUrl: input.imageUrl || "",
    featured: Boolean(input.featured),
    tags: input.tags || [],
    events: input.events || [],
    createdAt: nowIso(),
  };
  db.charities.unshift(charity);
  return charity;
}

export function signupUser(params: {
  name: string;
  email: string;
  password: string;
  plan: PlanType;
  charityId: string;
  charityPercent: number;
}): SessionUser {
  const existing = db.users.find((user) => user.email.toLowerCase() === params.email.toLowerCase());
  if (existing) {
    throw new Error("Email already in use");
  }
  if (params.charityPercent < MIN_CHARITY_PERCENT) {
    throw new Error(`Charity contribution must be at least ${MIN_CHARITY_PERCENT}%`);
  }

  const user: User = {
    id: uuid("user"),
    name: params.name,
    email: params.email.toLowerCase(),
    passwordHash: hashPassword(params.password),
    role: "subscriber",
    createdAt: nowIso(),
  };
  db.users.push(user);

  db.subscriptions.push({
    id: uuid("sub"),
    userId: user.id,
    plan: params.plan,
    status: "active",
    renewalDate: nextRenewal(params.plan),
    charityId: params.charityId,
    charityPercent: params.charityPercent,
    createdAt: nowIso(),
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export function loginUser(email: string, password: string): SessionUser {
  const user = db.users.find((entry) => entry.email.toLowerCase() === email.toLowerCase());
  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new Error("Invalid credentials");
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export function getSubscription(userId: string): Subscription | undefined {
  return db.subscriptions.find((subscription) => subscription.userId === userId);
}

export function updateSubscription(
  userId: string,
  updates: Partial<Pick<Subscription, "plan" | "status" | "charityId" | "charityPercent">>,
): Subscription {
  const sub = db.subscriptions.find((entry) => entry.userId === userId);
  if (!sub) {
    throw new Error("Subscription not found");
  }

  if (typeof updates.charityPercent === "number" && updates.charityPercent < MIN_CHARITY_PERCENT) {
    throw new Error(`Charity contribution must be at least ${MIN_CHARITY_PERCENT}%`);
  }

  Object.assign(sub, updates);

  if (updates.plan) {
    sub.renewalDate = nextRenewal(updates.plan);
  }

  return sub;
}

export function getUserScores(userId: string): ScoreEntry[] {
  return db.scores
    .filter((score) => score.userId === userId)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function addScore(userId: string, value: number, date: string): ScoreEntry[] {
  if (value < SCORE_MIN || value > SCORE_MAX) {
    throw new Error(`Score must be between ${SCORE_MIN} and ${SCORE_MAX}`);
  }

  db.scores.push({
    id: uuid("score"),
    userId,
    value,
    date,
    createdAt: nowIso(),
  });

  const ordered = getUserScores(userId);
  const keep = ordered.slice(0, 5);
  const removeIds = new Set(ordered.slice(5).map((entry) => entry.id));
  db.scores = db.scores.filter((entry) => !removeIds.has(entry.id));

  return keep;
}

export function editScore(userId: string, scoreId: string, value: number, date: string): ScoreEntry[] {
  if (value < SCORE_MIN || value > SCORE_MAX) {
    throw new Error(`Score must be between ${SCORE_MIN} and ${SCORE_MAX}`);
  }

  const score = db.scores.find((entry) => entry.id === scoreId && entry.userId === userId);
  if (!score) {
    throw new Error("Score not found");
  }

  score.value = value;
  score.date = date;
  return getUserScores(userId).slice(0, 5);
}

export function getUserDashboard(userId: string) {
  const subscription = getSubscription(userId);
  const scores = getUserScores(userId);
  const userWinners = db.winners.filter((winner) => winner.userId === userId);

  const drawsEntered = db.draws.filter((draw) => draw.published).length;
  const totalWon = userWinners.reduce((sum, winner) => sum + winner.amount, 0);

  return {
    subscription,
    scores,
    selectedCharity: db.charities.find((charity) => charity.id === subscription?.charityId),
    participation: {
      drawsEntered,
      upcomingDraw: `${getMonthKey()}-end`,
    },
    winnings: {
      totalWon,
      records: userWinners,
    },
  };
}

function computeMatchCount(ticket: number[], drawNumbers: number[]): WinnerTier | 0 {
  const matches = ticket.filter((value) => drawNumbers.includes(value)).length;
  if (matches === 5 || matches === 4 || matches === 3) {
    return matches;
  }
  return 0;
}

export function runDraw(params: { mode: DrawMode; simulate: boolean; userId: string }) {
  const monthKey = getMonthKey();
  const activeSubscriptions = db.subscriptions.filter((subscription) => subscription.status === "active");

  if (!params.simulate) {
    const existingPublished = db.draws.find((draw) => draw.monthKey === monthKey && draw.published);
    if (existingPublished) {
      throw new Error("This month draw has already been published");
    }
  }

  const scoreUniverse = activeSubscriptions.flatMap((subscription) =>
    getUserScores(subscription.userId)
      .slice(0, 5)
      .map((score) => score.value),
  );

  const drawNumbers =
    params.mode === "algorithmic"
      ? getWeightedNumbers(5, scoreUniverse)
      : pickUniqueRandomNumbers(5, SCORE_MIN, SCORE_MAX);

  const monthlyGross = activeSubscriptions.reduce(
    (sum, subscription) => sum + PLAN_PRICING[subscription.plan],
    0,
  );
  const prizePool = (monthlyGross * PRIZE_POOL_CONTRIBUTION_PERCENT) / 100;

  const jackpotCarryIn = db.jackpotRollover;

  const draw: Draw = {
    id: uuid("draw"),
    monthKey,
    mode: params.mode,
    numbers: drawNumbers,
    isSimulation: params.simulate,
    published: !params.simulate,
    executedAt: nowIso(),
    jackpotCarryIn,
    jackpotCarryOut: jackpotCarryIn,
    prizePoolTotal: prizePool,
  };

  const tickets = activeSubscriptions
    .map((subscription) => ({
      userId: subscription.userId,
      ticket: getUserScores(subscription.userId)
        .slice(0, 5)
        .map((score) => score.value),
    }))
    .filter((entry) => entry.ticket.length === 5);

  const winnersByTier = new Map<WinnerTier, string[]>();
  winnersByTier.set(5, []);
  winnersByTier.set(4, []);
  winnersByTier.set(3, []);

  for (const entry of tickets) {
    const matchTier = computeMatchCount(entry.ticket, drawNumbers);
    if (matchTier) {
      winnersByTier.get(matchTier)?.push(entry.userId);
    }
  }

  const fiveTierPool = prizePool * PRIZE_SPLIT[5] + jackpotCarryIn;
  const fourTierPool = prizePool * PRIZE_SPLIT[4];
  const threeTierPool = prizePool * PRIZE_SPLIT[3];

  const newWinners: Winner[] = [];
  const tierPools = new Map<WinnerTier, number>([
    [5, fiveTierPool],
    [4, fourTierPool],
    [3, threeTierPool],
  ]);

  for (const tier of [5, 4, 3] as WinnerTier[]) {
    const users = winnersByTier.get(tier) || [];
    if (users.length === 0) {
      continue;
    }
    const amount = tierPools.get(tier)! / users.length;
    for (const userId of users) {
      newWinners.push({
        id: uuid("winner"),
        drawId: draw.id,
        userId,
        tier,
        matches: tier,
        amount,
        status: "pending",
        payoutStatus: "pending",
        createdAt: nowIso(),
      });
    }
  }

  if ((winnersByTier.get(5) || []).length === 0) {
    draw.jackpotCarryOut = fiveTierPool;
  } else {
    draw.jackpotCarryOut = 0;
  }

  // Keep an auditable draw history for both simulation and published runs.
  db.draws.unshift(draw);

  if (!params.simulate) {
    db.winners.unshift(...newWinners);
    db.jackpotRollover = draw.jackpotCarryOut;
  }

  return {
    draw,
    winners: newWinners,
    summary: {
      tickets: tickets.length,
      winners5: (winnersByTier.get(5) || []).length,
      winners4: (winnersByTier.get(4) || []).length,
      winners3: (winnersByTier.get(3) || []).length,
    },
  };
}

export function listDraws(options?: { includeSimulations?: boolean }) {
  const includeSimulations = options?.includeSimulations ?? false;
  if (includeSimulations) {
    return db.draws;
  }
  return db.draws.filter((draw) => draw.published);
}

export function listWinners(userId?: string): Winner[] {
  return userId ? db.winners.filter((winner) => winner.userId === userId) : db.winners;
}

export function updateWinner(
  winnerId: string,
  updates: Partial<Pick<Winner, "proofUrl" | "status" | "payoutStatus" | "reviewedBy">>,
): Winner {
  const winner = db.winners.find((entry) => entry.id === winnerId);
  if (!winner) {
    throw new Error("Winner not found");
  }

  Object.assign(winner, updates);
  if (updates.status && updates.status !== "pending") {
    winner.reviewedAt = nowIso();
  }
  return winner;
}

export function getAdminStats() {
  const activeUsers = db.subscriptions.filter((subscription) => subscription.status === "active").length;
  const prizePoolTotal = db.draws.reduce((sum, draw) => sum + draw.prizePoolTotal, 0);

  const charityTotals = new Map<string, number>();
  for (const subscription of db.subscriptions.filter((entry) => entry.status === "active")) {
    const amount = (PLAN_PRICING[subscription.plan] * subscription.charityPercent) / 100;
    charityTotals.set(subscription.charityId, (charityTotals.get(subscription.charityId) || 0) + amount);
  }

  const charityContributionTotals = Array.from(charityTotals.entries()).map(([charityId, total]) => ({
    charityId,
    charityName: db.charities.find((charity) => charity.id === charityId)?.name || "Unknown",
    total,
  }));

  return {
    totals: {
      users: db.users.length,
      activeSubscribers: activeUsers,
      prizePoolTotal,
      jackpotRollover: db.jackpotRollover,
    },
    charityContributionTotals,
    drawStats: {
      published: db.draws.filter((draw) => draw.published).length,
      simulations: db.draws.filter((draw) => draw.isSimulation).length,
    },
    users: db.users,
    subscriptions: db.subscriptions,
    winners: db.winners,
    draws: db.draws,
  };
}

export function listUsers(): SessionUser[] {
  return db.users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  }));
}

export function updateUserProfile(userId: string, updates: Partial<Pick<User, "name" | "email" | "role">>): SessionUser {
  const user = db.users.find((entry) => entry.id === userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (updates.email) {
    const conflict = db.users.find((entry) => entry.email === updates.email && entry.id !== userId);
    if (conflict) {
      throw new Error("Email already in use");
    }
  }

  Object.assign(user, updates);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export function getAllSubscriptions() {
  return db.subscriptions;
}

export function getAllScores() {
  return db.scores;
}
