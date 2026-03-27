"use client";

import { useEffect, useMemo, useState } from "react";

interface Charity {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  featured: boolean;
  tags: string[];
  events: string[];
}

export default function CharitiesPage() {
  const [items, setItems] = useState<Charity[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/charities")
      .then((response) => response.json())
      .then((result) => setItems(result.data.charities || []));
  }, []);

  const filtered = useMemo(() => {
    if (!query) return items;
    return items.filter((item) => `${item.name} ${item.description} ${item.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase()));
  }, [items, query]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6">
      <h1 className="font-display text-4xl text-white">Charity Directory</h1>
      <p className="mt-2 text-slate-200/85">Find causes, upcoming events, and choose where your subscription makes impact.</p>

      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search by name, mission, or tag"
        className="mt-5 w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2"
      />

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {filtered.map((charity) => (
          <article key={charity.id} className="rounded-3xl border border-white/15 bg-white/[0.05] p-4">
            <div
              className="h-36 rounded-2xl bg-cover bg-center"
              style={{ backgroundImage: `url(${charity.imageUrl})` }}
            />
            <div className="mt-3 flex items-center justify-between gap-2">
              <h2 className="font-display text-xl text-cyan-100">{charity.name}</h2>
              {charity.featured ? (
                <span className="rounded-full bg-cyan-300/90 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-900">Featured</span>
              ) : null}
            </div>
            <p className="mt-2 text-sm text-slate-200/90">{charity.description}</p>
            <p className="mt-3 text-xs uppercase tracking-[0.18em] text-cyan-200">Events</p>
            <ul className="mt-1 text-sm text-slate-200/85">
              {charity.events.map((event) => (
                <li key={event}>• {event}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
