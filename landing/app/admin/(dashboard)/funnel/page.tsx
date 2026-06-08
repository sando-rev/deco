'use client';

/**
 * Admin Funnel Dashboard — /admin/funnel
 *
 * Visualizes the 6-step athlete conversion funnel:
 *   Signed up → Selected skills → Created goal → Reflected → Earned XP → Retained 7d
 */

import { useState, useEffect } from 'react';
import FunnelChart from '@/components/admin/FunnelChart';
import DataTable from '@/components/admin/DataTable';
import LoadingState from '@/components/admin/LoadingState';
import TimeRangeSelector from '@/components/admin/TimeRangeSelector';

// ─── Types ──────────────────────────────────────────────────────────────────

/**
 * `percentage` is always relative to the top-of-funnel (stage 0) value so
 * that FunnelChart can use it directly as a bar width and compute meaningful
 * step-to-step drop-off annotations.
 */
interface FunnelStage {
  label:      string;
  value:      number;
  percentage: number; // % of first-stage value (top-of-funnel)
}

interface FunnelData {
  stages: FunnelStage[];
}

// ─── Table columns ───────────────────────────────────────────────────────────

const COLUMNS = [
  { key: 'step',       label: 'Step',              align: 'left'  as const },
  { key: 'stage',      label: 'Stage',             align: 'left'  as const },
  { key: 'count',      label: 'Users',             align: 'right' as const },
  { key: 'pctOfPrev',  label: '% of Prev. Step',   align: 'right' as const },
  { key: 'pctOfTotal', label: '% of Total Athletes', align: 'right' as const },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AdminFunnelPage() {
  const [range, setRange] = useState('30d');
  const [data, setData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchData(selectedRange: string) {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/data?range=${selectedRange}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const json = await res.json();
      // The unified API returns stages with { label, value } — compute percentage client-side.
      // percentage is relative to the first stage (top-of-funnel) so FunnelChart can use it
      // as a bar width and calculate step-to-step drop-off correctly.
      const rawStages: { label: string; value: number }[] = json.funnel?.stages ?? [];
      const topOfFunnel = rawStages[0]?.value ?? 0;
      const stages: FunnelStage[] = rawStages.map((stage) => ({
        ...stage,
        percentage: topOfFunnel > 0
          ? Math.round((stage.value / topOfFunnel) * 100)
          : 0,
      }));
      setData({ stages });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData(range);
  }, [range]);

  // ── Error state ─────────────────────────────────────────────────────────
  if (error) {
    return (
      <div
        role="alert"
        className="flex flex-col items-center justify-center gap-3 py-24 text-center"
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-red-400"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p className="text-sm font-medium text-deco-text">Failed to load funnel data</p>
        <p className="text-xs text-deco-text-tertiary">{error}</p>
        <button
          onClick={() => fetchData(range)}
          className="mt-1 text-xs font-semibold text-deco-primary hover:text-deco-primary-dark underline focus:outline-none focus-visible:ring-2 focus-visible:ring-deco-primary rounded"
        >
          Try again
        </button>
      </div>
    );
  }

  // ── Build table rows from stages ──────────────────────────────────────────
  const totalAthletes = data?.stages[0]?.value ?? 1;

  const stages = data?.stages ?? [];
  const tableRows = stages.map((stage, i) => {
    const prevValue = i === 0 ? null : stages[i - 1].value;
    const pctOfPrev = prevValue === null
      ? '—'
      : prevValue > 0
        ? `${Math.round((stage.value / prevValue) * 100)}%`
        : '0%';
    return {
      step:       `${i + 1}`,
      stage:      stage.label,
      count:      stage.value.toLocaleString(),
      pctOfPrev,
      pctOfTotal: `${totalAthletes === 0 ? 0 : Math.round((stage.value / totalAthletes) * 100)}%`,
    };
  });

  return (
    <div className="space-y-6">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-deco-text tracking-tight">
            Conversion Funnel
          </h1>
          <p className="text-sm text-deco-text-secondary mt-0.5">
            Athlete progression from signup to 7-day retention
          </p>
        </div>
        <TimeRangeSelector value={range} onChange={setRange} />
      </div>

      {/* ── Loading ─────────────────────────────────────────────────────── */}
      {loading && <LoadingState cards={3} />}

      {/* ── Content ─────────────────────────────────────────────────────── */}
      {!loading && data && (
        <div className="space-y-6">
          {/* Funnel visualization */}
          <section
            className="bg-white rounded-2xl border border-deco-border shadow-sm"
            aria-label="Funnel chart"
          >
            <header className="px-6 pt-6 pb-4 border-b border-deco-border">
              <h2 className="text-sm font-semibold text-deco-text">
                Stage breakdown
              </h2>
              <p className="text-xs text-deco-text-tertiary mt-0.5">
                Each bar shows the count and percentage of athletes reaching that stage.
                Drop-off % is relative to the previous step.
              </p>
            </header>
            <div className="px-6 py-6">
              <FunnelChart stages={data.stages} />
            </div>
          </section>

          {/* Summary stat strip */}
          <section
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
            aria-label="Funnel stage summaries"
          >
            {data.stages.map((stage, i) => {
              const isFirst = i === 0;
              const prevValue = isFirst ? null : data.stages[i - 1].value;
              const stepConversion = prevValue === null
                ? null
                : prevValue > 0
                  ? Math.round((stage.value / prevValue) * 100)
                  : 0;
              const dropLabel = isFirst
                ? 'Baseline'
                : `${stepConversion}% conversion`;

              return (
                <div
                  key={stage.label}
                  className="bg-white rounded-xl border border-deco-border p-4 flex flex-col gap-1 shadow-sm"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-deco-primary/10 text-deco-primary flex items-center justify-center text-[10px] font-bold">
                      {i + 1}
                    </span>
                    <span className="text-xs font-medium text-deco-text-secondary truncate">
                      {stage.label}
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-deco-text tabular-nums">
                    {stage.value.toLocaleString()}
                  </span>
                  <span
                    className={[
                      'text-xs font-medium',
                      isFirst || stepConversion === null
                        ? 'text-deco-text-tertiary'
                        : stepConversion >= 70
                          ? 'text-emerald-600'
                          : stepConversion >= 40
                            ? 'text-amber-500'
                            : 'text-red-500',
                    ].join(' ')}
                  >
                    {dropLabel}
                  </span>
                </div>
              );
            })}
          </section>

          {/* Data table */}
          <section aria-label="Funnel data table">
            <header className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-deco-text">
                Detailed breakdown
              </h2>
              <span className="text-xs text-deco-text-tertiary">
                {data.stages.length} stages
              </span>
            </header>
            <DataTable columns={COLUMNS} data={tableRows} />
          </section>
        </div>
      )}
    </div>
  );
}
