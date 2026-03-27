"use client";

import { FormEvent, useEffect, useState } from "react";

interface Charity {
  id: string;
  name: string;
}

export default function SignupPage() {
  const [charities, setCharities] = useState<Charity[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [plan, setPlan] = useState<"monthly" | "yearly">("monthly");
  const [charityId, setCharityId] = useState("");
  const [charityPercent, setCharityPercent] = useState(10);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/charities")
      .then((response) => response.json())
      .then((result) => {
        setCharities(result.data.charities || []);
        if (result.data.charities?.[0]?.id) {
          setCharityId(result.data.charities[0].id);
        }
      });
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        password,
        plan,
        charityId,
        charityPercent,
      }),
    });

    const result = await response.json();
    if (!result.ok) {
      setError(result.error || "Unable to sign up");
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12">
      <div className="rounded-3xl border border-white/15 bg-white/5 p-7 md:p-9">
        <h1 className="font-display text-3xl text-white">Become a subscriber</h1>
        <p className="mt-2 text-sm text-slate-200/80">
          Create your account, then complete Stripe checkout from your dashboard to activate your subscription.
        </p>

        <form onSubmit={onSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block text-sm md:col-span-1">
            <span className="text-slate-200">Full name</span>
            <input
              className="mt-1 w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>
          <label className="block text-sm md:col-span-1">
            <span className="text-slate-200">Email</span>
            <input
              type="email"
              className="mt-1 w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="block text-sm md:col-span-2">
            <span className="text-slate-200">Password</span>
            <input
              type="password"
              className="mt-1 w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          <label className="block text-sm">
            <span className="text-slate-200">Plan</span>
            <select
              className="mt-1 w-full rounded-xl border border-white/20 bg-[#0c1733] px-3 py-2"
              value={plan}
              onChange={(event) => setPlan(event.target.value as "monthly" | "yearly")}
            >
              <option value="monthly">Monthly ($29)</option>
              <option value="yearly">Yearly ($299)</option>
            </select>
          </label>

          <label className="block text-sm">
            <span className="text-slate-200">Charity contribution (%)</span>
            <input
              type="number"
              min={10}
              max={100}
              className="mt-1 w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2"
              value={charityPercent}
              onChange={(event) => setCharityPercent(Number(event.target.value))}
            />
          </label>

          <label className="block text-sm md:col-span-2">
            <span className="text-slate-200">Choose charity</span>
            <select
              className="mt-1 w-full rounded-xl border border-white/20 bg-[#0c1733] px-3 py-2"
              value={charityId}
              onChange={(event) => setCharityId(event.target.value)}
              required
            >
              {charities.map((charity) => (
                <option key={charity.id} value={charity.id}>
                  {charity.name}
                </option>
              ))}
            </select>
          </label>

          {error ? <p className="text-sm text-rose-300 md:col-span-2">{error}</p> : null}

          <button
            type="submit"
            className="md:col-span-2 rounded-full bg-cyan-300 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-900 hover:bg-cyan-200"
          >
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
}


