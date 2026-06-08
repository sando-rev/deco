'use client';

/**
 * Admin — Users analytics page
 *
 * Sections:
 *   1. Time range selector
 *   2. KPI stat cards (total users, DAU)
 *   3. Signup trend — AreaChart (green)
 *   4. DAU LineChart
 *   5. User list DataTable (sortable)
 *
 * Data is fetched from the unified /api/admin/data endpoint.
 * WAU/MAU/retention are not available from the unified API and have been removed.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';

import ChartCard      from '@/components/admin/ChartCard';
import LoadingState   from '@/components/admin/LoadingState';
import StatCard       from '@/components/admin/StatCard';
import TimeRangeSelector from '@/components/admin/TimeRangeSelector';

// ─── Types ────────────────────────────────────────────────────────────────────

type Range = '7d' | '30d' | '90d' | 'all';

interface TimeseriesPoint {
  date: string;
  count: number;
}

interface UserRow {
  id: string;
  full_name: string;
  role: string;
  created_at: string;
  last_active_at: string | null;
  goals_count: number;
  reflections_count: number;
}

interface UnifiedData {
  overview: {
    signupTimeseries: TimeseriesPoint[];
    dauTimeseries: TimeseriesPoint[];
  };
  users: {
    userList: UserRow[];
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  try { return format(parseISO(iso), 'MMM d'); } catch { return iso; }
}

function fmtDateFull(iso: string): string {
  try { return format(parseISO(iso), 'MMM d, yyyy'); } catch { return iso; }
}

// ─── User list columns ────────────────────────────────────────────────────────

type SortKey = 'full_name' | 'role' | 'created_at' | 'last_active_at' | 'goals_count' | 'reflections_count';
type SortDir = 'asc' | 'desc';

const USER_COLUMNS: { key: SortKey; label: string; align?: 'left' | 'right' | 'center' }[] = [
  { key: 'full_name',          label: 'Name'        },
  { key: 'role',               label: 'Role'        },
  { key: 'created_at',         label: 'Joined'      },
  { key: 'last_active_at',     label: 'Last active' },
  { key: 'goals_count',        label: 'Goals',      align: 'right' },
  { key: 'reflections_count',  label: 'Reflections',align: 'right' },
];

function SortIcon({ dir }: { dir: SortDir | null }) {
  if (!dir) return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true" className="text-deco-text-tertiary">
      <path d="M5 1L8 4H2L5 1Z" fill="currentColor" opacity="0.4" />
      <path d="M5 9L2 6H8L5 9Z" fill="currentColor" opacity="0.4" />
    </svg>
  );
  return dir === 'asc' ? (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true" className="text-deco-primary">
      <path d="M5 1L8 4H2L5 1Z" fill="currentColor" />
    </svg>
  ) : (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true" className="text-deco-primary">
      <path d="M5 9L2 6H8L5 9Z" fill="currentColor" />
    </svg>
  );
}

function SortableUserTable({ users }: { users: UserRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleSort = useCallback((key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }, [sortKey]);

  const sorted = useMemo(() => {
    return [...users].sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      let cmp = 0;
      if (typeof av === 'number' && typeof bv === 'number') {
        cmp = av - bv;
      } else {
        cmp = String(av).localeCompare(String(bv));
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [users, sortKey, sortDir]);

  const formatCell = (key: SortKey, value: UserRow[SortKey]): string => {
    if (value == null) return '—';
    if ((key === 'created_at' || key === 'last_active_at') && typeof value === 'string') {
      return fmtDateFull(value);
    }
    return String(value);
  };

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-deco-border">
      <table className="min-w-full text-sm" role="table">
        <thead>
          <tr className="bg-deco-bg border-b border-deco-border">
            {USER_COLUMNS.map((col) => (
              <th
                key={col.key}
                scope="col"
                onClick={() => handleSort(col.key)}
                aria-sort={
                  sortKey === col.key
                    ? sortDir === 'asc' ? 'ascending' : 'descending'
                    : 'none'
                }
                className={[
                  'px-4 py-3 text-xs font-semibold text-deco-text-secondary uppercase tracking-wide whitespace-nowrap cursor-pointer select-none',
                  'hover:text-deco-text transition-colors duration-100',
                  col.align === 'right' ? 'text-right' : 'text-left',
                ].join(' ')}
              >
                <span className="inline-flex items-center gap-1.5">
                  {col.label}
                  <SortIcon dir={sortKey === col.key ? sortDir : null} />
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td
                colSpan={USER_COLUMNS.length}
                className="px-4 py-10 text-center text-sm text-deco-text-tertiary"
              >
                No users found.
              </td>
            </tr>
          ) : (
            sorted.map((user, i) => (
              <tr
                key={user.id}
                className={[
                  'border-b border-deco-border last:border-0 transition-colors duration-100 hover:bg-deco-bg/60',
                  i % 2 === 0 ? 'bg-deco-surface' : 'bg-deco-bg/40',
                ].join(' ')}
              >
                {USER_COLUMNS.map((col) => (
                  <td
                    key={col.key}
                    className={[
                      'px-4 py-3 text-deco-text whitespace-nowrap',
                      col.align === 'right' ? 'text-right tabular-nums' : '',
                    ].join(' ')}
                  >
                    {formatCell(col.key, user[col.key])}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Chart tooltip styles ─────────────────────────────────────────────────────

const tooltipStyle = {
  backgroundColor: '#fff',
  border: '1px solid #E5E7EB',
  borderRadius: '8px',
  fontSize: '12px',
  color: '#1A1A2E',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const [range, setRange] = useState<Range>('30d');
  const [data, setData]   = useState<UnifiedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]  = useState<string | null>(null);

  // Fetch on mount and range change
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/admin/data?range=${range}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<UnifiedData>;
      })
      .then((json) => {
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message ?? 'Failed to load data');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [range]);

  // ── KPI summary numbers ──────────────────────────────────────────────────
  const totalUsers = data
    ? data.overview.signupTimeseries.reduce((sum, p) => sum + p.count, 0)
    : 0;

  const latestDAU = data?.overview.dauTimeseries.at(-1)?.count ?? 0;

  // Trend: compare last value to previous value
  const trend = (series: { count: number }[]) => {
    if (series.length < 2) return undefined;
    const prev = series[series.length - 2].count;
    const curr = series[series.length - 1].count;
    if (prev === 0) return undefined;
    const val = Math.round(((curr - prev) / prev) * 100);
    return { value: Math.abs(val), positive: val >= 0 };
  };

  // ── Render ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="p-6 space-y-6" aria-label="Users analytics loading">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-deco-text">Users</h1>
        </div>
        <LoadingState cards={2} />
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-6" aria-label="Users analytics error">
        <div
          role="alert"
          className="rounded-xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700"
        >
          Failed to load users data: {error}
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6" aria-label="Users analytics">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-deco-text">Users</h1>
        <TimeRangeSelector value={range} onChange={(r) => setRange(r as Range)} />
      </div>

      {/* ── KPI Stat cards ── */}
      <section
        aria-label="Key metrics"
        className="grid grid-cols-2 gap-4"
      >
        <StatCard
          title="New signups"
          value={totalUsers}
          subtitle={`In selected period`}
          trend={trend(data?.overview.signupTimeseries ?? [])}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
          }
        />
        <StatCard
          title="DAU (latest)"
          value={latestDAU}
          subtitle="Daily active users"
          trend={trend(data?.overview.dauTimeseries ?? [])}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          }
        />
      </section>

      {/* ── Signup trend AreaChart ── */}
      <ChartCard title="Daily Signups">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart
            data={data?.overview.signupTimeseries ?? []}
            margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="signupGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#1B6B4A" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#1B6B4A" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={fmtDate}
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
              minTickGap={24}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              labelFormatter={(label) => fmtDateFull(String(label))}
              formatter={(v) => [String(v), 'Signups']}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#1B6B4A"
              strokeWidth={2}
              fill="url(#signupGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#1B6B4A' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* ── DAU LineChart ── */}
      <ChartCard title="DAU — Daily Active Users">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart
            data={data?.overview.dauTimeseries ?? []}
            margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={fmtDate}
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
              minTickGap={24}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              labelFormatter={(label) => fmtDateFull(String(label))}
              formatter={(v) => [String(v), 'DAU']}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#2D9B6A"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, fill: '#2D9B6A' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* ── User list ── */}
      <section aria-label="User list">
        <h2 className="text-sm font-semibold text-deco-text mb-3">
          Recent Users{' '}
          <span className="text-deco-text-tertiary font-normal">
            (latest {data?.users.userList.length ?? 0})
          </span>
        </h2>
        <SortableUserTable users={data?.users.userList ?? []} />
      </section>
    </main>
  );
}
