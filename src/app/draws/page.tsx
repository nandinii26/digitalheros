"use client";

import { useEffect, useState } from "react";

interface Draw {
  id: string;
  monthKey: string;
  mode: "random" | "algorithmic";
  numbers: number[];
  published: boolean;
  isSimulation: boolean;
  prizePoolTotal: number;
  jackpotCarryIn: number;
  jackpotCarryOut: number;
}

export default function DrawsPage() {
  const [draws, setDraws] = useState<Draw[]>([]);

  useEffect(() => {
    fetch("/api/draws")
      .then((response) => response.json())
      .then((result) => setDraws(result.data.draws || []));
  }, []);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 md:px-6">
      <h1 className="font-display text-4xl text-white">Monthly Draws</h1>
      <p className="mt-2 text-sm text-slate-200/85">5-match jackpot rolls over if unclaimed. 4-match and 3-match are split each month.</p>

      <div className="mt-6 space-y-3">
        {draws.length === 0 ? (
          <div className="rounded-3xl border border-white/15 bg-white/[0.05] p-5 text-sm text-slate-200/85">
            No published draws yet. Admin can run simulation and publish from the admin panel.
          </div>
        ) : (
          draws.map((draw) => (
            <article key={draw.id} className="rounded-3xl border border-white/15 bg-white/[0.05] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-2xl text-cyan-100">{draw.monthKey}</h2>
                <span className="text-xs uppercase tracking-[0.14em] text-cyan-200">{draw.mode} mode</span>
              </div>
              <p className="mt-3 text-sm text-slate-100">Numbers: {draw.numbers.join(" · ")}</p>
              <p className="mt-2 text-xs text-slate-300">
                Pool ${draw.prizePoolTotal.toFixed(2)} | Carry in ${draw.jackpotCarryIn.toFixed(2)} | Carry out ${draw.jackpotCarryOut.toFixed(2)}
              </p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
