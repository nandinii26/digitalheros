import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-10 md:px-6">
      <section className="hero-glow rounded-[2.2rem] border border-white/15 px-6 py-12 md:px-12 md:py-16">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/90">Golf. Give. Win.</p>
        <h1 className="mt-4 max-w-3xl font-display text-4xl leading-tight text-white md:text-6xl">
          A draw-powered golf subscription that turns every score into real-world impact.
        </h1>
        <p className="mt-5 max-w-2xl text-base text-slate-200/90 md:text-lg">
          Subscribe monthly or yearly, enter your latest five Stableford scores, support a charity you care about,
          and join monthly reward draws with jackpot rollover.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href="/signup"
            className="rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-slate-900 transition hover:translate-y-[-1px] hover:bg-cyan-200"
          >
            Start Subscription
          </Link>
          <Link
            href="/charities"
            className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:border-white/70"
          >
            Explore Charities
          </Link>
        </div>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Subscription Engine",
            body: "Monthly and yearly plans with lifecycle-aware access and status checks.",
          },
          {
            title: "Smart Draw Engine",
            body: "Random or algorithmic monthly draws with simulation and controlled publishing.",
          },
          {
            title: "Charity-Centered",
            body: "At least 10% contribution by default, with user-controlled uplift and transparent totals.",
          },
        ].map((item) => (
          <article key={item.title} className="slide-up rounded-3xl border border-white/15 bg-white/[0.04] p-5">
            <h2 className="font-display text-xl text-cyan-100">{item.title}</h2>
            <p className="mt-2 text-sm text-slate-200/90">{item.body}</p>
          </article>
        ))}
      </section>

      <section className="mt-10 grid gap-4 rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 md:grid-cols-4 md:p-8">
        {[
          ["1", "Choose plan and charity"],
          ["2", "Enter latest 5 Stableford scores"],
          ["3", "Join monthly draw pools"],
          ["4", "Track winnings and impact"],
        ].map(([step, text]) => (
          <div key={step} className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">Step {step}</p>
            <p className="text-sm text-slate-100">{text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
