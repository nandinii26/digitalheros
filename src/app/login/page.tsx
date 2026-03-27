"use client";

import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("demo@birdieforgood.com");
  const [password, setPassword] = useState("Demo123!");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();
    if (!result.ok) {
      setError(result.error || "Unable to login");
      return;
    }

    const target = result.data?.role === "admin" ? "/admin" : "/dashboard";
    window.location.href = target;
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-14">
      <div className="rounded-3xl border border-white/15 bg-white/[0.05] p-7">
        <h1 className="font-display text-3xl text-white">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-200/80">Sign in with subscriber or admin credentials.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="text-slate-200">Email</span>
            <input
              className="mt-1 w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white outline-none focus:border-cyan-300"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-200">Password</span>
            <input
              className="mt-1 w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white outline-none focus:border-cyan-300"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}

          <button
            type="submit"
            className="w-full rounded-full bg-cyan-300 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-900 hover:bg-cyan-200"
          >
            Login
          </button>
          <p className="text-xs text-slate-300/80">Admin demo: admin@birdieforgood.com / Admin123!</p>
        </form>
      </div>
    </div>
  );
}

