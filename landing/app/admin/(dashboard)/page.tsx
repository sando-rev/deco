'use client';

/**
 * Admin Overview Dashboard — /admin
 *
 * Displays key metrics and time-series charts for the Deco platform.
 * Data is fetched from /api/admin/data (unified endpoint) with the selected time range.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import StatCard from '@/components/admin/StatCard';
import ChartCard from '@/components/admin/ChartCard';
import TimeRangeSelector from '@/components/admin/TimeRangeSelector';
import LoadingState from '@/components/admin/LoadingState';

// ─── Types ──────────────────────────────────────────────────────────────────

interface TimeseriesPoint {
  date: string;
  count: number;
}

interface OverviewData {
  totalUsers:       number;
  athletes:         number;
  coaches:          number;
  newUsers:         number;
  totalGoals:       number;
  totalReflections: number;
  totalXp:          number;
  signupTimeseries: TimeseriesPoint[];
  dauTimeseries:    TimeseriesPoint[];
}

// ─── Tooltip ────────────────────────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length || !label) return null;

  let displayDate = label;
  try {
    displayDate = format(parseISO(label), 'MMM d, yyyy');
  } catch {
    // use raw label if parsing fails
  }

  return (
    <div className="bg-white border border-deco-border rounded-lg shadow-md px-3 py-2 text-sm">
      <p className="font-medium text-deco-text">{displayDate}</p>
      <p className="text-deco-primary font-semibold tabular-nums">
        {payload[0].value.toLocaleString()}
      </p>
    </div>
  );
}

// ─── Tick formatters ────────────────────────────────────────────────────────

function formatAxisDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'MMM d');
  } catch {
    return dateStr;
  }
}

// ─── Icons ──────────────────────────────────────────────────────────────────

const XpIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const UsersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
  </svg>
);

const AthleteIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="4" />
    <path d="M6 21v-1a6 6 0 0112 0v1" strokeLinecap="round" />
  </svg>
);

const CoachIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7l-9-5z" />
  </svg>
);

const GoalIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
  </svg>
);

const ReflectionIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
);

// ─── Page ───────────────────────────────────────────────────────────────────

export default function AdminOverviewPage() {
  const [range, setRange] = useState('30d');
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (selectedRange: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/data?range=${selectedRange}`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json.overview as OverviewData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(range);
  }, [range, fetchData]);

  // ── Error state ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div
        role="alert"
        className="flex flex-col items-center justify-center gap-3 py-24 text-center"
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-400" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p className="text-sm font-medium text-deco-text">Failed to load overview</p>
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

  return (
    <div className="space-y-6">
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-deco-text tracking-tight">Overview</h1>
          <p className="text-sm text-deco-text-secondary mt-0.5">
            Platform health at a glance
          </p>
        </div>
        <TimeRangeSelector value={range} onChange={setRange} />
      </div>

      {/* ── Loading skeleton ─────────────────────────────────────────────── */}
      {loading && <LoadingState cards={6} />}

      {/* ── Content ─────────────────────────────────────────────────────── */}
      {!loading && data && (
        <>
          {/* Stat cards — 2 cols mobile, 3 cols tablet, 6 cols desktop */}
          <section
            className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4"
            aria-label="Key metrics"
          >
            <StatCard
              title="Total Users"
              value={data.totalUsers}
              subtitle={`+${data.newUsers.toLocaleString()} in range`}
              icon={<UsersIcon />}
            />
            <StatCard
              title="Athletes"
              value={data.athletes}
              subtitle="Role: athlete"
              icon={<AthleteIcon />}
            />
            <StatCard
              title="Coaches"
              value={data.coaches}
              subtitle="Role: coach"
              icon={<CoachIcon />}
            />
            <StatCard
              title="Goals"
              value={data.totalGoals}
              subtitle="All time"
              icon={<GoalIcon />}
            />
            <StatCard
              title="Reflections"
              value={data.totalReflections}
              subtitle="All time"
              icon={<ReflectionIcon />}
            />
            <StatCard
              title="Total XP"
              value={data.totalXp}
              subtitle="Earned across platform"
              icon={<XpIcon />}
            />
          </section>

          {/* Charts — side by side on md+ */}
          <section
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            aria-label="Timeseries charts"
          >
            {/* Signups over time */}
            <ChartCard title="Signups over time">
              {data.signupTimeseries.length === 0 ? (
                <p className="flex items-center justify-center h-52 text-sm text-deco-text-tertiary">
                  No signup data for this range.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart
                    data={data.signupTimeseries}
                    margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="signupGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#1B6B4A" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#1B6B4A" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#E5E7EB"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatAxisDate}
                      tick={{ fontSize: 11, fill: '#9CA3AF' }}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={40}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#9CA3AF' }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#1B6B4A"
                      strokeWidth={2}
                      fill="url(#signupGradient)"
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0, fill: '#1B6B4A' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* DAU over time */}
            <ChartCard title="Daily active users (DAU)">
              {data.dauTimeseries.length === 0 ? (
                <p className="flex items-center justify-center h-52 text-sm text-deco-text-tertiary">
                  No activity data for this range.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart
                    data={data.dauTimeseries}
                    margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#E5E7EB"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatAxisDate}
                      tick={{ fontSize: 11, fill: '#9CA3AF' }}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={40}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#9CA3AF' }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#F5A623"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0, fill: '#F5A623' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </section>
        </>
      )}
    </div>
  );
}
