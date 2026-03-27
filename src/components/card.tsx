import type { ReactNode } from "react";

export function Card({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-3xl border border-white/15 bg-white/[0.06] p-5 shadow-[0_20px_40px_rgba(2,8,20,0.28)] ${className}`}>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200/90">{title}</h2>
      <div className="text-sm text-slate-100/90">{children}</div>
    </section>
  );
}
