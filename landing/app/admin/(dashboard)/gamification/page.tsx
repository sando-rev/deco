'use client';

/**
 * Admin — Gamification Analytics
 *
 * Shows XP economy, event type breakdown, per-athlete distribution,
 * and achievement unlock rates.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import Sidebar from '@/components/admin/Sidebar';
import StatCard from '@/components/admin/StatCard';
import ChartCard from '@/components/admin/ChartCard';
import TimeRangeSelector from '@/components/admin/TimeRangeSelector';
import LoadingState from '@/components/admin/LoadingState';

// ── Types ────────────────────────────────────────────────────────────────────

interface XpTimeseries    { date: string; total: number }
interface XpByType        { event_type: string; total: number; count: number }
interface XpDistribution  { athlete_id: string; full_name: string; total_xp: number }
interface AchievementRate { key: string; label: string; description: string; earned: number; total_athletes: number; rate: number }
interface StreakDistribution { streak: number; count: number }

interface GamificationData {
  totalXpAwarded: number;
  xpTimeseries: XpTimeseries[];
  xpByType: XpByType[];
  xpDistribution: XpDistribution[];
  achievementRates: AchievementRate[];
  streakDistribution: StreakDistribution[];
}

// ── Palette ──────────────────────────────────────────────────────────────────

const COLOR_GOLD   = '#F5A623';
const COLOR_GOLD_DIM = '#FDE68A';
const COLOR_GREEN  = '#2D9B6A';
const COLOR_TEAL   = '#0E9B8A';
const COLOR_GRAY   = '#E5E7EB';

const BAR_COLORS = [
  COLOR_GREEN, COLOR_TEAL, '#4F9EF5', '#A78BFA', '#F472B6', '#34D399',
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function fmtEventType(raw: string): string {
  return raw.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const tickStyle = { fill: '#9CA3AF', fontSize: 11 };

// ── XP Histogram builder ─────────────────────────────────────────────────────
// Bucket xpDistribution into ~8 buckets for a histogram chart

function buildHistogram(dist: XpDistribution[], buckets = 8): { range: string; athletes: number }[] {
  if (dist.length === 0) return [];
  const values = dist.map((d) => d.total_xp);
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return [{ range: String(min), athletes: values.length }];

  const bucketSize = Math.ceil((max - min + 1) / buckets);
  const result: { range: string; athletes: number }[] = Array.from({ length: buckets }, (_, i) => {
    const lo = min + i * bucketSize;
    const hi = lo + bucketSize - 1;
    return { range: `${lo}–${hi}`, athletes: 0 };
  });

  for (const v of values) {
    const idx = Math.min(Math.floor((v - min) / bucketSize), buckets - 1);
    result[idx].athletes++;
  }

  return result.filter((b) => b.athletes > 0);
}

// ── Component ────────────────────────────────────────────────────────────────

export default function GamificationPage() {
  const [range, setRange] = useState('30d');
  const [data, setData] = useState<GamificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (r: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/data?range=${r}`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json.gamification as GamificationData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(range); }, [range, fetchData]);

  // Derived
  const athleteCount = data ? new Set(data.xpDistribution.map((d) => d.athlete_id)).size : 0;
  const avgXp = athleteCount > 0 && data
    ? Math.round(data.totalXpAwarded / athleteCount)
    : 0;

  const topAchievement = data?.achievementRates[0]?.label ?? '—';

  const xpHistogram = data ? buildHistogram(data.xpDistribution) : [];

  return (
    <div className="flex min-h-screen bg-deco-bg">
      <Sidebar />

      <main className="flex-1 ml-60 p-8 min-w-0" id="main-content">
        {/* Page header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-deco-text tracking-tight">Gamification</h1>
            <p className="text-sm text-deco-text-secondary mt-1">
              XP economy, achievements, and streak behaviour
            </p>
          </div>
          <TimeRangeSelector value={range} onChange={setRange} />
        </header>

        {/* Error state */}
        {error && (
          <div
            role="alert"
            className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="shrink-0">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {loading && <LoadingState cards={3} />}

        {!loading && data && (
          <div className="space-y-6">
            {/* ── Stat cards ───────────────────────────────────────────────── */}
            <section
              aria-label="Key gamification metrics"
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              <StatCard
                title="Total XP Awarded"
                value={data.totalXpAwarded.toLocaleString()}
                subtitle={`Across ${range === 'all' ? 'all time' : `last ${range}`}`}
              />
              <StatCard
                title="Avg XP per Athlete"
                value={avgXp.toLocaleString()}
                subtitle={`${athleteCount} athletes with XP`}
              />
              <StatCard
                title="Most Common Achievement"
                value={topAchievement}
                subtitle={
                  data.achievementRates[0]
                    ? `${data.achievementRates[0].rate}% of athletes`
                    : 'No achievements recorded'
                }
              />
            </section>

            {/* ── XP over time ─────────────────────────────────────────────── */}
            <ChartCard title="XP Awarded Over Time">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart
                  data={data.xpTimeseries.map((d) => ({ ...d, date: fmtDate(d.date) }))}
                  margin={{ top: 4, right: 8, left: -8, bottom: 4 }}
                >
                  <defs>
                    <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={COLOR_GOLD} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLOR_GOLD} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="date" tick={tickStyle} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={tickStyle} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }}
                    cursor={{ stroke: COLOR_GOLD, strokeWidth: 1 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="XP Awarded"
                    stroke={COLOR_GOLD}
                    strokeWidth={2.5}
                    fill="url(#xpGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: COLOR_GOLD }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* ── XP by type + distribution ────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title="XP by Event Type">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={data.xpByType.map((d) => ({
                      ...d,
                      event_type: fmtEventType(d.event_type),
                    }))}
                    layout="vertical"
                    margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={tickStyle}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="event_type"
                      tick={tickStyle}
                      axisLine={false}
                      tickLine={false}
                      width={120}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }}
                      cursor={{ fill: '#F0F4F2' }}
                      formatter={(val) => [(val as number).toLocaleString()]}
                    />
                    <Bar dataKey="total" name="Total XP" radius={[0, 4, 4, 0]} maxBarSize={24}>
                      {data.xpByType.map((_, i) => (
                        <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="XP Distribution Across Athletes">
                {xpHistogram.length === 0 ? (
                  <div className="flex items-center justify-center h-64 text-sm text-deco-text-tertiary">
                    No XP data in this period
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={xpHistogram}
                      margin={{ top: 4, right: 8, left: -16, bottom: 24 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                      <XAxis
                        dataKey="range"
                        tick={{ ...tickStyle, fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        angle={-30}
                        textAnchor="end"
                        interval={0}
                        label={{ value: 'XP Range', position: 'insideBottom', offset: -12, style: { fontSize: 11, fill: '#9CA3AF' } }}
                      />
                      <YAxis
                        tick={tickStyle}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                        label={{ value: 'Athletes', angle: -90, position: 'insideLeft', offset: 12, style: { fontSize: 11, fill: '#9CA3AF' } }}
                      />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }}
                        cursor={{ fill: '#F0F4F2' }}
                        formatter={(val) => [String(val), 'Athletes']}
                      />
                      <Bar dataKey="athletes" name="Athletes" fill={COLOR_GOLD} radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>
            </div>

            {/* ── Achievement unlock rates ──────────────────────────────────── */}
            <ChartCard title="Achievement Unlock Rates">
              {data.achievementRates.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-sm text-deco-text-tertiary">
                  No achievements configured
                </div>
              ) : (
                <ResponsiveContainer
                  width="100%"
                  height={Math.max(200, data.achievementRates.length * 44)}
                >
                  <BarChart
                    data={data.achievementRates.map((a) => ({
                      label: a.label,
                      rate: a.rate,
                      earned: a.earned,
                    }))}
                    layout="vertical"
                    margin={{ top: 4, right: 64, left: 8, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
                      tick={tickStyle}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="label"
                      tick={tickStyle}
                      axisLine={false}
                      tickLine={false}
                      width={140}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }}
                      cursor={{ fill: '#F0F4F2' }}
                      formatter={(val, _name, props: any) => [
                        `${val}% (${props?.payload?.earned ?? 0} athletes)`,
                        'Unlock Rate',
                      ]}
                    />
                    <Bar dataKey="rate" name="Unlock Rate %" radius={[0, 4, 4, 0]} maxBarSize={24}>
                      {data.achievementRates.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={
                            entry.rate >= 50
                              ? COLOR_GREEN
                              : entry.rate >= 20
                              ? COLOR_GOLD
                              : COLOR_GRAY
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>
        )}
      </main>
    </div>
  );
}
