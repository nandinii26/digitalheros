"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/card";

interface AdminStats {
  totals: {
    users: number;
    activeSubscribers: number;
    prizePoolTotal: number;
    jackpotRollover: number;
  };
  charityContributionTotals: Array<{ charityId: string; charityName: string; total: number }>;
  drawStats: { published: number; simulations: number };
  draws: Array<{
    id: string;
    monthKey: string;
    mode: "random" | "algorithmic";
    numbers: number[];
    published: boolean;
    isSimulation: boolean;
    prizePoolTotal: number;
    jackpotCarryIn: number;
    jackpotCarryOut: number;
  }>;
  winners: Array<{ id: string; userId: string; tier: number; amount: number; status: string; payoutStatus: string }>;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "subscriber" | "admin";
}

interface AdminSubscription {
  id: string;
  userId: string;
  plan: "monthly" | "yearly";
  status: "active" | "inactive" | "lapsed" | "cancelled";
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [charityName, setCharityName] = useState("");
  const [charityDescription, setCharityDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const response = await fetch("/api/admin/stats");
    const result = await response.json();
    if (!result.ok) {
      setError(result.error || "Unauthorized");
      return;
    }
    setStats(result.data.stats);

    const usersResponse = await fetch("/api/admin/users");
    const usersResult = await usersResponse.json();
    if (usersResult.ok) {
      setUsers(usersResult.data.users || []);
      setSubscriptions(usersResult.data.subscriptions || []);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function runDraw(mode: "random" | "algorithmic", simulate: boolean) {
    const response = await fetch("/api/draws", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, simulate }),
    });
    const result = await response.json();
    if (!result.ok) {
      setError(result.error || "Could not run draw");
      return;
    }
    setError(null);
    await load();
  }

  async function reviewWinner(id: string, status: "approved" | "rejected") {
    const response = await fetch("/api/winners", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const result = await response.json();
    if (!result.ok) {
      setError(result.error || "Failed review action");
      return;
    }
    await load();
  }

  async function markPaid(id: string) {
    const response = await fetch("/api/winners", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, payoutStatus: "paid" }),
    });
    const result = await response.json();
    if (!result.ok) {
      setError(result.error || "Failed to mark payout");
      return;
    }
    await load();
  }

  async function toggleSubscription(userId: string, status: "active" | "inactive") {
    const response = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "subscription", userId, status }),
    });
    const result = await response.json();
    if (!result.ok) {
      setError(result.error || "Failed to update subscription");
      return;
    }
    await load();
  }

  async function createCharity() {
    const response = await fetch("/api/charities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: charityName, description: charityDescription }),
    });
    const result = await response.json();
    if (!result.ok) {
      setError(result.error || "Failed to create charity");
      return;
    }
    setCharityName("");
    setCharityDescription("");
    await load();
  }

  if (error) {
    return <div className="mx-auto max-w-6xl px-4 py-10 text-rose-300">{error}</div>;
  }

  if (!stats) {
    return <div className="mx-auto max-w-6xl px-4 py-10 text-slate-200">Loading admin dashboard...</div>;
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-8 md:grid-cols-2 md:px-6">
      <Card title="Platform Totals">
        <p>Total users: {stats.totals.users}</p>
        <p>Active subscribers: {stats.totals.activeSubscribers}</p>
        <p>Total prize pools: ${stats.totals.prizePoolTotal.toFixed(2)}</p>
        <p>Jackpot rollover: ${stats.totals.jackpotRollover.toFixed(2)}</p>
      </Card>

      <Card title="Draw Management">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => runDraw("random", true)} className="rounded-full border border-white/30 px-4 py-2 text-xs uppercase tracking-[0.14em]">Simulate Random</button>
          <button onClick={() => runDraw("algorithmic", true)} className="rounded-full border border-white/30 px-4 py-2 text-xs uppercase tracking-[0.14em]">Simulate Algo</button>
          <button onClick={() => runDraw("random", false)} className="rounded-full bg-cyan-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-900">Publish Random</button>
          <button onClick={() => runDraw("algorithmic", false)} className="rounded-full bg-cyan-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-900">Publish Algo</button>
        </div>
        <p className="mt-3 text-xs text-slate-300">Published draws: {stats.drawStats.published} | Simulations: {stats.drawStats.simulations}</p>
      </Card>

      <Card title="Charity Contributions" className="md:col-span-2">
        <div className="grid gap-2 md:grid-cols-3">
          {stats.charityContributionTotals.map((item) => (
            <div key={item.charityId} className="rounded-2xl border border-white/15 p-3">
              <p className="font-semibold text-cyan-100">{item.charityName}</p>
              <p className="text-sm">${item.total.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Winner Verification" className="md:col-span-2">
        <div className="space-y-2 text-xs">
          {stats.winners.length === 0 ? (
            <p>No winners yet.</p>
          ) : (
            stats.winners.map((winner) => (
              <div key={winner.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/15 p-2">
                <p>
                  {winner.userId} | Tier {winner.tier} | ${winner.amount.toFixed(2)} | {winner.status} | {winner.payoutStatus}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => reviewWinner(winner.id, "approved")} className="rounded-full border border-white/30 px-3 py-1">Approve</button>
                  <button onClick={() => reviewWinner(winner.id, "rejected")} className="rounded-full border border-white/30 px-3 py-1">Reject</button>
                  <button onClick={() => markPaid(winner.id)} className="rounded-full border border-white/30 px-3 py-1">Mark Paid</button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card title="Recent Draw Results" className="md:col-span-2">
        <div className="space-y-2 text-xs">
          {stats.draws.length === 0 ? (
            <p>No draw runs yet.</p>
          ) : (
            stats.draws.slice(0, 8).map((draw) => (
              <div key={draw.id} className="rounded-xl border border-white/15 p-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p>
                    {draw.monthKey} | {draw.mode} | Numbers: {draw.numbers.join(" ")}
                  </p>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] ${
                      draw.published ? "border-emerald-300/40 text-emerald-200" : "border-amber-300/40 text-amber-200"
                    }`}
                  >
                    {draw.published ? "Published" : "Simulation"}
                  </span>
                </div>
                <p className="mt-1 text-slate-300">
                  Pool ${draw.prizePoolTotal.toFixed(2)} | Carry in ${draw.jackpotCarryIn.toFixed(2)} | Carry out ${draw.jackpotCarryOut.toFixed(2)}
                </p>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card title="User Management" className="md:col-span-2">
        <div className="space-y-2 text-xs">
          {users.map((user) => {
            const subscription = subscriptions.find((item) => item.userId === user.id);
            return (
              <div key={user.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/15 p-2">
                <p>
                  {user.name} ({user.email}) | {user.role} | {subscription?.plan || "no plan"} | {subscription?.status || "no subscription"}
                </p>
                {subscription ? (
                  <button
                    onClick={() => toggleSubscription(user.id, subscription.status === "active" ? "inactive" : "active")}
                    className="rounded-full border border-white/30 px-3 py-1"
                  >
                    {subscription.status === "active" ? "Deactivate" : "Activate"}
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="Charity Management" className="md:col-span-2">
        <div className="grid gap-2 md:grid-cols-2">
          <input
            value={charityName}
            onChange={(event) => setCharityName(event.target.value)}
            placeholder="Charity name"
            className="rounded-xl border border-white/20 bg-white/5 px-3 py-2"
          />
          <input
            value={charityDescription}
            onChange={(event) => setCharityDescription(event.target.value)}
            placeholder="Charity description"
            className="rounded-xl border border-white/20 bg-white/5 px-3 py-2"
          />
        </div>
        <button
          onClick={createCharity}
          className="mt-3 rounded-full bg-cyan-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-900"
        >
          Add Charity
        </button>
      </Card>
    </div>
  );
}
