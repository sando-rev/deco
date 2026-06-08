'use client';

/**
 * Admin — Engagement Analytics
 *
 * Shows goal creation, status breakdown, reflections quality,
 * AI feedback usage, AI scores, and skill assessment trends.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import Sidebar from '@/components/admin/Sidebar';
import StatCard from '@/components/admin/StatCard';
import ChartCard from '@/components/admin/ChartCard';
import TimeRangeSelector from '@/components/admin/TimeRangeSelector';
import LoadingState from '@/components/admin/LoadingState';

// ── Types ────────────────────────────────────────────────────────────────────

interface GoalsTimeseries { date: string; count: number }
interface GoalsByStatus { active: number; achieved: number; abandoned: number }
interface ReflectionsTimeseries { date: string; count: number }
interface ReflectionQuality { total: number; withNotes: number }
interface AiFeedbackUsage { total: number; withAi: number }
interface AvgAiScores { specificity: number; measurability: number; challenge: number }
interface SkillAssessments { date: string; count: number }

interface EngagementData {
  goalsTimeseries: GoalsTimeseries[];
  goalsByStatus: GoalsByStatus;
  reflectionsTimeseries: ReflectionsTimeseries[];
  reflectionQuality: ReflectionQuality;
  aiFeedbackUsage: AiFeedbackUsage;
  avgAiScores: AvgAiScores;
  skillAssessments: SkillAssessments[];
}

// ── Chart colour palette ─────────────────────────────────────────────────────

const COLOR_GREEN  = '#2D9B6A';
const COLOR_GOLD   = '#F5A623';
const COLOR_GRAY   = '#9CA3AF';
const COLOR_TEAL   = '#0E9B8A';

const PIE_COLORS: Record<string, string> = {
  active:    COLOR_GREEN,
  achieved:  COLOR_GOLD,
  abandoned: COLOR_GRAY,
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

const tickStyle = { fill: '#9CA3AF', fontSize: 11 };

// ── Component ────────────────────────────────────────────────────────────────

export default function EngagementPage() {
  const [range, setRange] = useState('30d');
  const [data, setData] = useState<EngagementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (r: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/data?range=${r}`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json.engagement as EngagementData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(range); }, [range, fetchData]);

  // Derived
  const pieData = data
    ? [
        { name: 'Active',    value: data.goalsByStatus.active    },
        { name: 'Achieved',  value: data.goalsByStatus.achieved  },
        { name: 'Abandoned', value: data.goalsByStatus.abandoned },
      ].filter((d) => d.value > 0)
    : [];

  const aiScoresData = data
    ? [
        { name: 'Specificity',   score: data.avgAiScores.specificity   },
        { name: 'Measurability', score: data.avgAiScores.measurability },
        { name: 'Challenge',     score: data.avgAiScores.challenge     },
      ]
    : [];

  const aiRate = data && data.aiFeedbackUsage.total > 0
    ? Math.round((data.aiFeedbackUsage.withAi / data.aiFeedbackUsage.total) * 100)
    : 0;

  return (
    <div className="flex min-h-screen bg-deco-bg">
      <Sidebar />

      {/* Main content — offset by sidebar width */}
      <main className="flex-1 ml-60 p-8 min-w-0" id="main-content">
        {/* Page header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-deco-text tracking-tight">Engagement</h1>
            <p className="text-sm text-deco-text-secondary mt-1">
              Goal activity, reflections, and AI feedback usage
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

        {/* Loading skeletons */}
        {loading && <LoadingState cards={4} />}

        {/* Content */}
        {!loading && data && (
          <div className="space-y-6">
            {/* ── Stat cards ───────────────────────────────────────────────── */}
            <section
              aria-label="Key engagement metrics"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <StatCard
                title="Total Goals"
                value={data.aiFeedbackUsage.total}
                subtitle={`${data.goalsByStatus.active} active · ${data.goalsByStatus.achieved} achieved`}
              />
              <StatCard
                title="Completion Rate"
                value={`${data.aiFeedbackUsage.total > 0 ? Math.round((data.goalsByStatus.achieved / data.aiFeedbackUsage.total) * 100) : 0}%`}
                subtitle={`${data.goalsByStatus.achieved} goals achieved`}
              />
              <StatCard
                title="AI Usage Rate"
                value={`${aiRate}%`}
                subtitle={`${data.aiFeedbackUsage.withAi} of ${data.aiFeedbackUsage.total} goals`}
              />
              <StatCard
                title="Total Reflections"
                value={data.reflectionQuality.total}
                subtitle={`${data.reflectionQuality.withNotes} with notes`}
              />
            </section>

            {/* ── Goals over time + status breakdown ───────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ChartCard title="Goals Created Over Time" className="lg:col-span-2">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={data.goalsTimeseries.map((d) => ({ ...d, date: fmtDate(d.date) }))}
                    margin={{ top: 4, right: 8, left: -16, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis dataKey="date" tick={tickStyle} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={tickStyle} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }}
                      cursor={{ fill: '#F0F4F2' }}
                    />
                    <Bar dataKey="count" name="Goals" fill={COLOR_GREEN} radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Goal Status Breakdown">
                <div className="flex flex-col items-center justify-center h-full gap-4 py-2">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        aria-label="Goal status distribution"
                      >
                        {pieData.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={PIE_COLORS[entry.name.toLowerCase()] ?? COLOR_TEAL}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Legend */}
                  <ul className="flex flex-col gap-1.5 w-full px-2" aria-label="Legend">
                    {pieData.map((entry) => (
                      <li key={entry.name} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2">
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: PIE_COLORS[entry.name.toLowerCase()] ?? COLOR_TEAL }}
                            aria-hidden="true"
                          />
                          <span className="text-deco-text-secondary">{entry.name}</span>
                        </span>
                        <span className="font-semibold text-deco-text">{entry.value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </ChartCard>
            </div>

            {/* ── Reflections over time ─────────────────────────────────────── */}
            <ChartCard title="Reflections Over Time">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={data.reflectionsTimeseries.map((d) => ({ ...d, date: fmtDate(d.date) }))}
                  margin={{ top: 4, right: 8, left: -16, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="date" tick={tickStyle} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={tickStyle} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }}
                    cursor={{ fill: '#F0F4F2' }}
                  />
                  <Bar dataKey="count" name="Reflections" fill={COLOR_TEAL} radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* ── AI Scores + Skill assessments ────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title="Average AI Feedback Scores">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart
                    data={aiScoresData}
                    margin={{ top: 4, right: 8, left: -16, bottom: 4 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                    <XAxis
                      type="number"
                      domain={[0, 10]}
                      tick={tickStyle}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={tickStyle}
                      axisLine={false}
                      tickLine={false}
                      width={90}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }}
                      cursor={{ fill: '#F0F4F2' }}
                    />
                    <Bar dataKey="score" name="Avg Score" fill={COLOR_GOLD} radius={[0, 4, 4, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
                {data.aiFeedbackUsage.withAi === 0 && (
                  <p className="text-center text-xs text-deco-text-tertiary mt-2">
                    No AI analyses in this period
                  </p>
                )}
              </ChartCard>

              <ChartCard title="Skill Assessments Over Time">
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart
                    data={data.skillAssessments.map((d) => ({ ...d, date: fmtDate(d.date) }))}
                    margin={{ top: 4, right: 8, left: -16, bottom: 4 }}
                  >
                    <defs>
                      <linearGradient id="skillGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={COLOR_GREEN} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={COLOR_GREEN} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis dataKey="date" tick={tickStyle} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={tickStyle} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }}
                      cursor={{ stroke: COLOR_GREEN, strokeWidth: 1 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      name="Assessments"
                      stroke={COLOR_GREEN}
                      strokeWidth={2}
                      fill="url(#skillGrad)"
                      dot={false}
                      activeDot={{ r: 4, fill: COLOR_GREEN }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
