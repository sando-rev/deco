"use client";

/**
 * /admin/training — Training session analytics dashboard.
 *
 * Sections:
 *   - Stat row: Total Sessions | Completion Rate | Goal Selection Rate
 *   - BarChart: Sessions over time
 *   - PieChart: Session types breakdown
 *   - Completion rate visual indicator card
 */

import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import StatCard from "@/components/admin/StatCard";
import ChartCard from "@/components/admin/ChartCard";
import TimeRangeSelector from "@/components/admin/TimeRangeSelector";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SessionDataPoint {
  date: string;
  count: number;
}

interface CompletionRate {
  total: number;
  withReflection: number;
  rate: number;
}

interface SessionType {
  type: string;
  count: number;
}

interface GoalSelectionUsage {
  totalSessions: number;
  withGoals: number;
  rate: number;
}

interface TrainingData {
  sessionsTimeseries: SessionDataPoint[];
  completionRate: CompletionRate;
  sessionTypes: SessionType[];
  goalSelectionUsage: GoalSelectionUsage;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const TargetIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

// ─── Pie chart colours per session type ──────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  training: "#2D9B6A",
  match:    "#1B6B4A",
  gym:      "#F5A623",
  other:    "#9CA3AF",
};

function typeColor(type: string): string {
  return TYPE_COLORS[type.toLowerCase()] ?? "#9CA3AF";
}

function typeLabel(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}

// ─── Skeleton / loading ───────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-deco-surface rounded-xl p-5 shadow-sm border border-deco-border animate-pulse">
      <div className="h-3 w-28 bg-deco-border rounded mb-4" />
      <div className="h-8 w-20 bg-deco-border rounded mb-2" />
      <div className="h-2.5 w-36 bg-deco-border rounded" />
    </div>
  );
}

function SkeletonChart({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-deco-surface rounded-xl shadow-sm border border-deco-border animate-pulse ${className}`}>
      <div className="px-5 pt-5 pb-4 border-b border-deco-border">
        <div className="h-3.5 w-40 bg-deco-border rounded" />
      </div>
      <div className="px-5 py-4">
        <div className="h-52 bg-deco-border/40 rounded-lg" />
      </div>
    </div>
  );
}

// ─── Custom tooltips ──────────────────────────────────────────────────────────

interface TooltipPayloadItem {
  value: number;
  name: string;
  payload?: SessionType;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function BarTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-deco-surface border border-deco-border rounded-lg shadow-md px-3 py-2 text-xs">
      <p className="text-deco-text-secondary font-medium mb-1">{label}</p>
      <p className="text-deco-text font-semibold">
        {payload[0].value.toLocaleString()} sessions
      </p>
    </div>
  );
}

function PieTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-deco-surface border border-deco-border rounded-lg shadow-md px-3 py-2 text-xs">
      <p className="text-deco-text-secondary font-medium mb-1">
        {typeLabel(item.payload?.type ?? item.name)}
      </p>
      <p className="text-deco-text font-semibold">
        {item.value.toLocaleString()} sessions
      </p>
    </div>
  );
}

// ─── Completion Rate Visual Card ──────────────────────────────────────────────

function CompletionRateCard({ completionRate }: { completionRate: CompletionRate }) {
  const rate = Math.round(completionRate.rate);
  const clampedRate = Math.min(100, Math.max(0, rate));

  const rateColor =
    rate >= 75
      ? "text-emerald-600"
      : rate >= 50
      ? "text-amber-600"
      : "text-red-600";

  const barColor =
    rate >= 75
      ? "bg-emerald-500"
      : rate >= 50
      ? "bg-amber-400"
      : "bg-red-400";

  return (
    <section
      className="bg-deco-surface rounded-xl p-5 shadow-sm border border-deco-border flex flex-col gap-4"
      aria-label="Session completion rate details"
    >
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-deco-text">Reflection Completion</h2>
        <span
          className={`text-2xl font-bold tabular-nums ${rateColor}`}
          aria-label={`${rate}% completion rate`}
        >
          {rate}%
        </span>
      </header>

      {/* Progress bar */}
      <div>
        <div
          className="h-3 w-full bg-deco-border rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={clampedRate}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${rate}% of sessions have a reflection`}
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${clampedRate}%` }}
          />
        </div>
      </div>

      {/* Breakdown */}
      <dl className="grid grid-cols-2 gap-3">
        <div className="bg-deco-bg rounded-lg px-3 py-2.5">
          <dt className="text-xs text-deco-text-secondary mb-0.5">With Reflection</dt>
          <dd className="text-lg font-bold text-emerald-600 tabular-nums">
            {completionRate.withReflection.toLocaleString()}
          </dd>
        </div>
        <div className="bg-deco-bg rounded-lg px-3 py-2.5">
          <dt className="text-xs text-deco-text-secondary mb-0.5">Without Reflection</dt>
          <dd className="text-lg font-bold text-deco-text-secondary tabular-nums">
            {(completionRate.total - completionRate.withReflection).toLocaleString()}
          </dd>
        </div>
      </dl>

      <p className="text-xs text-deco-text-tertiary">
        {completionRate.total.toLocaleString()} total sessions in period
      </p>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TrainingPage() {
  const [range, setRange] = useState("30d");
  const [data, setData] = useState<TrainingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (selectedRange: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/data?range=${selectedRange}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const json = await res.json();
      setData(json.training as TrainingData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(range);
  }, [range, fetchData]);

  function handleRangeChange(next: string) {
    setRange(next);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-deco-text tracking-tight">
            Training Analytics
          </h2>
          <p className="text-sm text-deco-text-secondary mt-0.5">
            Session volume, completion, and goal adoption
          </p>
        </div>
        <TimeRangeSelector value={range} onChange={handleRangeChange} />
      </div>

      {/* Error banner */}
      {error && (
        <div role="alert" className="flex items-start gap-2.5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 shrink-0" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Total Sessions"
            value={data.completionRate.total}
            subtitle="Scheduled sessions in period"
            icon={<CalendarIcon />}
          />
          <StatCard
            title="Completion Rate"
            value={`${Math.round(data.completionRate.rate)}%`}
            subtitle={`${data.completionRate.withReflection.toLocaleString()} sessions with reflection`}
            icon={<CheckCircleIcon />}
          />
          <StatCard
            title="Goal Selection Rate"
            value={`${Math.round(data.goalSelectionUsage.rate)}%`}
            subtitle={`${data.goalSelectionUsage.withGoals.toLocaleString()} of ${data.goalSelectionUsage.totalSessions.toLocaleString()} sessions`}
            icon={<TargetIcon />}
          />
        </div>
      ) : null}

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Sessions over time */}
        {loading ? (
          <SkeletonChart />
        ) : data ? (
          <ChartCard title="Sessions Over Time">
            {data.sessionsTimeseries.length === 0 ? (
              <div className="flex items-center justify-center h-52 text-sm text-deco-text-tertiary">
                No session data in this period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={data.sessionsTimeseries}
                  margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#9CA3AF" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: string) => {
                      const d = new Date(v);
                      return `${d.getMonth() + 1}/${d.getDate()}`;
                    }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#9CA3AF" }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<BarTooltip />} cursor={{ fill: "rgba(27,107,74,0.06)" }} />
                  <Bar
                    dataKey="count"
                    name="sessions"
                    fill="#1B6B4A"
                    radius={[3, 3, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        ) : null}

        {/* Session types pie */}
        {loading ? (
          <SkeletonChart />
        ) : data ? (
          <ChartCard title="Session Type Breakdown">
            {data.sessionTypes.length === 0 ? (
              <div className="flex items-center justify-center h-52 text-sm text-deco-text-tertiary">
                No session type data in this period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={data.sessionTypes}
                    dataKey="count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {data.sessionTypes.map((entry) => (
                      <Cell
                        key={entry.type}
                        fill={typeColor(entry.type)}
                        stroke="transparent"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend
                    formatter={(value: string) => (
                      <span className="text-xs text-deco-text-secondary">
                        {typeLabel(value)}
                      </span>
                    )}
                    iconType="circle"
                    iconSize={8}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        ) : null}
      </div>

      {/* Completion rate visual card */}
      {loading ? (
        <SkeletonChart className="min-h-[160px]" />
      ) : data ? (
        <CompletionRateCard completionRate={data.completionRate} />
      ) : null}
    </div>
  );
}
