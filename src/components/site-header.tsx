"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { APP_NAME } from "@/lib/constants";
import type { SessionUser } from "@/lib/types";

export function SiteHeader() {
  const [session, setSession] = useState<SessionUser | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((response) => response.json())
      .then((result) => setSession(result.data.session ?? null))
      .catch(() => setSession(null));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/20 bg-[rgba(4,7,20,0.75)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <Link href="/" className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-200">
          {APP_NAME}
        </Link>

        <nav className="flex items-center gap-5 text-sm text-slate-100/85">
          <Link href="/charities" className="hover:text-white">Charities</Link>
          <Link href="/draws" className="hover:text-white">Draws</Link>
          {session ? <Link href="/dashboard" className="hover:text-white">Dashboard</Link> : null}
          {session?.role === "admin" ? <Link href="/admin" className="hover:text-white">Admin</Link> : null}
          {!session ? (
            <>
              <Link href="/login" className="hover:text-white">Login</Link>
              <Link
                href="/signup"
                className="rounded-full bg-cyan-300 px-4 py-2 font-semibold text-slate-900 transition hover:bg-cyan-200"
              >
                Subscribe
              </Link>
            </>
          ) : (
            <button
              onClick={logout}
              className="rounded-full border border-white/25 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition hover:border-white/55"
            >
              Logout
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
