"use client";

import { useEffect, useState } from "react";

type SkillResult = {
  skill_name: string;
  scale_id: string;
  value: number;
  ai_substitution_rate: number;
  half_life_years: number;
  extinction_risk_5yr: number;
  category?: string;
};

type CategoryStat = {
  category: string;
  mean: number;
  count: number;
};

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SkillResult[]>([]);

  const [highRisk, setHighRisk] = useState<SkillResult[]>([]);
  const [lowRisk, setLowRisk] = useState<SkillResult[]>([]);
  const [categories, setCategories] = useState<CategoryStat[]>([]);

  // Load dashboard data once
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [hiRes, loRes, catRes] = await Promise.all([
          fetch("http://127.0.0.1:8000/high-risk").then((r) => r.json()),
          fetch("http://127.0.0.1:8000/low-risk").then((r) => r.json()),
          fetch("http://127.0.0.1:8000/category-stats").then((r) => r.json()),
        ]);
        setHighRisk(hiRes);
        setLowRisk(loRes);
        setCategories(catRes);
      } catch {
        // Optional: surface a banner in UI if needed
      }
    };
    loadDashboard();
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/skill?name=${encodeURIComponent(
          query.trim()
        )}`
      );

      if (!res.ok) {
        if (res.status === 404) {
          setError("No matching skills found in HSER's radar.");
        } else {
          setError("Server error. Try again.");
        }
        setLoading(false);
        return;
      }

      const data = await res.json();
      setResults(data.skills || []);
    } catch (e) {
      setError("Cannot reach HSER API. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const top = results[0];

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Hero */}
        <header className="mb-10">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-emerald-400">
            Antevenio / Human Skill Extinction Radar
          </p>
          <h1 className="mt-3 text-4xl font-semibold md:text-5xl">
            See which skills quietly die in the next 5 years.
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-gray-400">
            HSER models skill half‑life and extinction risk instead of jobs.
            It treats automation as a compression force acting on micro‑skills,
            not whole careers.
          </p>
        </header>

        {/* Search card */}
        <section className="mb-8 rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-950 to-gray-900/80 p-5 shadow-lg">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search a skill: Writing, Reading Comprehension, Data entry..."
              className="flex-1 rounded-lg border border-gray-700 bg-black/70 px-4 py-3 text-sm outline-none ring-emerald-500/70 focus:ring-2"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="rounded-lg bg-emerald-500 px-5 py-3 text-sm font-medium text-black transition hover:bg-emerald-400 disabled:opacity-60"
            >
              {loading ? "Scanning..." : "Scan extinction risk"}
            </button>
          </div>
          {error && (
            <p className="mt-3 text-xs text-red-400">
              {error}
            </p>
          )}
          <p className="mt-3 text-[11px] text-gray-500">
            HSER does not predict titles like &quot;Software Engineer&quot;. It
            predicts the decay of the underlying micro‑skills that tools
            automate first.
          </p>
        </section>

        {/* Selected skill detail */}
        {top && (
          <section className="mb-10 grid gap-6 md:grid-cols-[2fr,1.2fr]">
            <div className="rounded-xl border border-gray-800 bg-gray-950/80 p-6">
              <p className="text-xs uppercase tracking-wide text-emerald-400">
                Focus skill
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                {top.skill_name}
              </h2>
              <p className="mt-1 text-xs text-gray-400">
                Scale: {top.scale_id} • Importance score: {top.value} •{" "}
                {top.category || "Unclassified"}
              </p>

              <div className="mt-6">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Extinction risk (5 years)</span>
                  <span className="font-semibold text-emerald-400">
                    {top.extinction_risk_5yr.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-gray-800">
                  <div
                    className="h-2 rounded-full bg-emerald-500"
                    style={{
                      width: `${Math.min(
                        100,
                        top.extinction_risk_5yr
                      )}%`,
                    }}
                  />
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4 text-xs">
                  <div className="rounded-lg border border-gray-800 bg-black/40 p-3">
                    <p className="text-gray-400">Skill half‑life</p>
                    <p className="mt-1 text-lg font-semibold">
                      {top.half_life_years.toFixed(1)} yrs
                    </p>
                    <p className="mt-1 text-[11px] text-gray-500">
                      Time until half the value of this skill can be replicated
                      by automation.
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-800 bg-black/40 p-3">
                    <p className="text-gray-400">AI substitution score</p>
                    <p className="mt-1 text-lg font-semibold">
                      {top.ai_substitution_rate.toFixed(2)}
                    </p>
                    <p className="mt-1 text-[11px] text-gray-500">
                      0 → hard to replace, 1 → trivial for models / tools to
                      absorb.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <aside className="rounded-xl border border-gray-800 bg-gradient-to-b from-emerald-900/40 to-gray-950 p-5 text-xs text-gray-300">
              <p className="text-[11px] font-mono uppercase tracking-wide text-emerald-400">
                HSER interpretation
              </p>
              <p className="mt-2">
                High risk means this skill is being compressed into clicks,
                prompts, or background agents. The fewer decisions humans make
                while using it, the shorter its half‑life.
              </p>
              <p className="mt-2">
                To keep this skill alive, pair it with meta‑skills: problem
                framing, cross‑domain reasoning, and system design that AI
                cannot fully automate.
              </p>
              <p className="mt-3 text-[11px] text-gray-500">
                Prototype model – use alongside local labor data and domain
                experience, not as standalone career advice.
              </p>
            </aside>
          </section>
        )}

        {/* Nearby skills */}
        {results.length > 1 && (
          <section className="mb-10 rounded-xl border border-gray-800 bg-gray-950/70 p-5">
            <p className="text-xs font-mono uppercase tracking-wide text-gray-400">
              Nearby skills ({results.length - 1} more signals)
            </p>
            <div className="mt-3 grid gap-2 text-xs md:grid-cols-2">
              {results.slice(1, 6).map((s) => (
                <div
                  key={`${s.skill_name}-${s.scale_id}`}
                  className="flex items-center justify-between rounded-lg border border-gray-800 bg-black/40 px-3 py-2"
                >
                  <span className="truncate pr-4">
                    {s.skill_name}
                  </span>
                  <span className="text-emerald-400">
                    {s.extinction_risk_5yr.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Global dashboard panels */}
        <section className="mt-6 grid gap-6 md:grid-cols-3">
          {/* High-risk skills */}
          <div className="rounded-xl border border-gray-800 bg-gray-950/80 p-4">
            <h3 className="text-xs font-mono uppercase tracking-wide text-red-400">
              Highest extinction risk
            </h3>
            <p className="mt-1 text-[11px] text-gray-500">
              Skills HSER believes are most aggressively compressible by
              automation.
            </p>
            <div className="mt-3 space-y-2 text-xs">
              {highRisk.map((s) => (
                <div
                  key={`${s.skill_name}-${s.scale_id}`}
                  className="flex items-center justify-between rounded-lg bg-black/40 px-3 py-2"
                >
                  <span className="truncate pr-3">{s.skill_name}</span>
                  <span className="font-semibold text-red-400">
                    {s.extinction_risk_5yr.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Low-risk skills */}
          <div className="rounded-xl border border-gray-800 bg-gray-950/80 p-4">
            <h3 className="text-xs font-mono uppercase tracking-wide text-emerald-400">
              Most resilient skills
            </h3>
            <p className="mt-1 text-[11px] text-gray-500">
              Skills where HSER sees slower decay and harder substitution.
            </p>
            <div className="mt-3 space-y-2 text-xs">
              {lowRisk.map((s) => (
                <div
                  key={`${s.skill_name}-${s.scale_id}`}
                  className="flex items-center justify-between rounded-lg bg-black/40 px-3 py-2"
                >
                  <span className="truncate pr-3">{s.skill_name}</span>
                  <span className="font-semibold text-emerald-400">
                    {s.extinction_risk_5yr.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Category stats */}
          <div className="rounded-xl border border-gray-800 bg-gray-950/80 p-4">
            <h3 className="text-xs font-mono uppercase tracking-wide text-sky-400">
              Category outlook
            </h3>
            <p className="mt-1 text-[11px] text-gray-500">
              Average 5‑year extinction risk by skill genre.
            </p>
            <div className="mt-3 space-y-3 text-xs">
              {categories.map((c) => (
                <div key={c.category}>
                  <div className="flex items-center justify-between">
                    <span>{c.category}</span>
                    <span className="font-semibold text-sky-400">
                      {c.mean.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-gray-800">
                    <div
                      className="h-1.5 rounded-full bg-sky-500"
                      style={{ width: `${Math.min(100, c.mean)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-gray-500">
                    {c.count} skills in this bucket.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
