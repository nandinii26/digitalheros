"use client";

import { FormEvent, useEffect, useState } from "react";
import { Card } from "@/components/card";

interface DashboardData {
  subscription?: {
    plan: string;
    status: string;
    renewalDate: string;
    charityPercent: number;
    charityId: string;
  };
  scores: Array<{ id: string; value: number; date: string }>;
  selectedCharity?: { id: string; name: string };
  participation: { drawsEntered: number; upcomingDraw: string };
  winnings: {
    totalWon: number;
    records: Array<{ id: string; tier: number; amount: number; status: string; payoutStatus: string; proofUrl?: string }>;
  };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [score, setScore] = useState(30);
  const [scoreDate, setScoreDate] = useState(new Date().toISOString().slice(0, 10));
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const response = await fetch("/api/dashboard");
    const result = await response.json();
    if (!result.ok) {
      window.location.href = "/login";
      return;
    }
    setData(result.data.dashboard);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  async function saveScore(event: FormEvent) {
    event.preventDefault();
    setMessage(null);

    const response = await fetch("/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: score, date: scoreDate }),
    });
    const result = await response.json();
    if (!result.ok) {
      setMessage(result.error || "Failed to save score");
      return;
    }
    setMessage("Score saved. Rolling top 5 updated.");
    await load();
  }

  async function updateCharityContribution(percent: number) {
    const response = await fetch("/api/subscription", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ charityPercent: percent }),
    });
    const result = await response.json();
    if (!result.ok) {
      setMessage(result.error || "Update failed");
      return;
    }
    await load();
    setMessage("Charity contribution updated.");
  }

  async function startCheckout(plan: "monthly" | "yearly") {
    const response = await fetch("/api/payments/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const result = await response.json();
    if (!result.ok) {
      setMessage(result.error || "Checkout unavailable");
      return;
    }
    window.location.href = result.data.url;
  }

  async function uploadProof(winnerId: string) {
    const proofUrl = prompt("Enter screenshot URL for verification");
    if (!proofUrl) return;

    const response = await fetch("/api/winners", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: winnerId, proofUrl }),
    });
    const result = await response.json();
    if (!result.ok) {
      setMessage(result.error || "Could not upload proof");
      return;
    }
    await load();
    setMessage("Proof submitted for admin verification.");
  }

  if (!data) {
    return <div className="mx-auto max-w-5xl px-4 py-10 text-slate-200">Loading dashboard...</div>;
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-8 md:grid-cols-2 md:px-6">
      <Card title="Subscription Status">
        <p>Status: {data.subscription?.status || "inactive"}</p>
        <p>Plan: {data.subscription?.plan || "-"}</p>
        <p>Renewal: {data.subscription?.renewalDate?.slice(0, 10) || "-"}</p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => startCheckout("monthly")}
            className="rounded-full border border-white/30 px-3 py-1 text-[10px] uppercase tracking-[0.14em]"
          >
            Pay Monthly
          </button>
          <button
            onClick={() => startCheckout("yearly")}
            className="rounded-full border border-white/30 px-3 py-1 text-[10px] uppercase tracking-[0.14em]"
          >
            Pay Yearly
          </button>
        </div>
      </Card>

      <Card title="Charity Selection">
        <p>Current charity: {data.selectedCharity?.name || "Not selected"}</p>
        <p>Contribution: {data.subscription?.charityPercent || 10}%</p>
        <button
          onClick={() => updateCharityContribution((data.subscription?.charityPercent || 10) + 5)}
          className="mt-3 rounded-full border border-white/30 px-4 py-2 text-xs uppercase tracking-[0.14em] hover:border-white/70"
        >
          Increase by 5%
        </button>
      </Card>

      <Card title="Score Entry">
        <form onSubmit={saveScore} className="space-y-3">
          <label className="block">
            <span>Stableford Score (1-45)</span>
            <input
              type="number"
              min={1}
              max={45}
              value={score}
              onChange={(event) => setScore(Number(event.target.value))}
              className="mt-1 w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2"
            />
          </label>
          <label className="block">
            <span>Date</span>
            <input
              type="date"
              value={scoreDate}
              onChange={(event) => setScoreDate(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2"
            />
          </label>
          <button className="rounded-full bg-cyan-300 px-5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-900 hover:bg-cyan-200">
            Save Score
          </button>
        </form>
        <div className="mt-4 space-y-1 text-xs text-slate-300">
          {data.scores.map((entry) => (
            <p key={entry.id}>{entry.date}: {entry.value}</p>
          ))}
        </div>
      </Card>

      <Card title="Participation & Winnings">
        <p>Draws entered: {data.participation.drawsEntered}</p>
        <p>Upcoming draw window: {data.participation.upcomingDraw}</p>
        <p className="mt-2 text-cyan-200">Total won: ${data.winnings.totalWon.toFixed(2)}</p>
        <div className="mt-3 space-y-2 text-xs">
          {data.winnings.records.length === 0 ? (
            <p>No winnings yet.</p>
          ) : (
            data.winnings.records.map((record) => (
              <div key={record.id} className="rounded-xl border border-white/15 p-2">
                <p>Tier {record.tier} | ${record.amount.toFixed(2)}</p>
                <p>Status: {record.status} | Payout: {record.payoutStatus}</p>
                <button
                  onClick={() => uploadProof(record.id)}
                  className="mt-1 rounded-full border border-white/30 px-3 py-1 text-[10px] uppercase tracking-[0.12em]"
                >
                  Upload Proof
                </button>
              </div>
            ))
          )}
        </div>
      </Card>

      {message ? <p className="md:col-span-2 text-sm text-cyan-200">{message}</p> : null}
    </div>
  );
}
