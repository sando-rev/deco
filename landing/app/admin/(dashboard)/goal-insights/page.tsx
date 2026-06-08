'use client';

/**
 * Admin — Goal Insights
 *
 * Deep dive into what goals athletes create, which skills they target,
 * goal quality (AI scores), reflection ratings, and coach feedback patterns.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Sidebar from '@/components/admin/Sidebar';
import StatCard from '@/components/admin/StatCard';
import ChartCard from '@/components/admin/ChartCard';
import LoadingState from '@/components/admin/LoadingState';

// ── Types ────────────────────────────────────────────────────────────────────

interface GoalBySkill { skill: string; category: string; count: number }
interface GoalByCategory { category: string; count: number }
interface GoalsByStatus { active: number; achieved: number; abandoned: number }
interface ReflectionRating { rating: number; count: number }

interface GoalQuality {
  total: number;
  withAi: number;
  highQuality: number;
  mediumQuality: number;
  lowQuality: number;
  avgSpecificity: number | null;
  avgMeasurability: number | null;
  avgChallenge: number | null;
}

interface CoachFeedbackSummary {
  totalComments: number;
  thumbsUpOnly: number;
  withText: number;
  avgPerGoal: number;
}

interface GoalRow {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  athlete_name: string;
  skill_label: string | null;
  skill_category: string | null;
  ai_feedback: string | null;
  specificity: number | null;
  measurability: number | null;
  challenge: number | null;
  reflection_count: number;
  avg_rating: number | null;
  coach_comments_count: number;
  has_thumbs_up: boolean | null;
}

interface ReflectionRow {
  id: string;
  session_type: string;
  notes: string | null;
  created_at: string;
  athlete_name: string;
  goal_ratings: { goal_title: string; rating: number }[] | null;
}

interface GoalInsightsData {
  goalsBySkill: GoalBySkill[];
  goalsByCategory: GoalByCategory[];
  goalsByStatus: GoalsByStatus;
  goalQuality: GoalQuality;
  reflectionRatings: ReflectionRating[];
  coachFeedbackSummary: CoachFeedbackSummary;
  topGoalTexts: GoalRow[];
  reflectionsList: ReflectionRow[];
  aiScoreDistribution: { bucket: number; count: number }[];
}

// ── Palette ──────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  technical: '#2D9B6A',
  tactical: '#4F9EF5',
  physical: '#F5A623',
  mental: '#A78BFA',
};

const STATUS_COLORS: Record<string, string> = {
  active: '#2D9B6A',
  achieved: '#F5A623',
  abandoned: '#9CA3AF',
};

const tickStyle = { fill: '#9CA3AF', fontSize: 11 };

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  } catch { return iso; }
}

function fmtCategory(c: string): string {
  return c.charAt(0).toUpperCase() + c.slice(1);
}

function ScoreDot({ value }: { value: number | null }) {
  if (value == null) return <span className="text-deco-text-tertiary">—</span>;
  const color = value >= 7 ? '#2D9B6A' : value >= 5 ? '#F5A623' : '#EF4444';
  return (
    <span className="inline-flex items-center gap-1">
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="tabular-nums">{value}</span>
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? '#9CA3AF';
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: `${color}20`, color }}
    >
      {status}
    </span>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export default function GoalInsightsPage() {
  const [data, setData] = useState<GoalInsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'goals' | 'reflections'>('goals');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/goal-insights', { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json() as GoalInsightsData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Derived
  const statusPie = data
    ? [
        { name: 'Active', value: data.goalsByStatus.active },
        { name: 'Achieved', value: data.goalsByStatus.achieved },
        { name: 'Abandoned', value: data.goalsByStatus.abandoned },
      ].filter((d) => d.value > 0)
    : [];

  const qualityPie = data?.goalQuality
    ? [
        { name: 'High (7+)', value: data.goalQuality.highQuality, color: '#2D9B6A' },
        { name: 'Medium (5-7)', value: data.goalQuality.mediumQuality, color: '#F5A623' },
        { name: 'Low (<5)', value: data.goalQuality.lowQuality, color: '#EF4444' },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="flex min-h-screen bg-deco-bg">
      <Sidebar />

      <main className="flex-1 ml-60 p-8 min-w-0" id="main-content">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-deco-text tracking-tight">Goal Insights</h1>
          <p className="text-sm text-deco-text-secondary mt-1">
            What athletes write, which skills they target, and how coaches respond
          </p>
        </header>

        {error && (
          <div role="alert" className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="shrink-0">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {loading && <LoadingState cards={4} />}

        {!loading && data && (
          <div className="space-y-6">
            {/* ── Stat cards ──────────────────────────────────────────── */}
            <section aria-label="Goal metrics" className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                title="Total Goals"
                value={data.goalQuality.total}
                subtitle={`${data.goalsByStatus.active} active · ${data.goalsByStatus.achieved} achieved`}
              />
              <StatCard
                title="Avg Specificity"
                value={data.goalQuality.avgSpecificity ?? '—'}
                subtitle="AI specificity score (1-10)"
              />
              <StatCard
                title="Coach Comments"
                value={data.coachFeedbackSummary.totalComments}
                subtitle={`${data.coachFeedbackSummary.withText} with text · ${data.coachFeedbackSummary.thumbsUpOnly} thumbs-up only`}
              />
              <StatCard
                title="Reflection Ratings"
                value={data.reflectionRatings.length > 0
                  ? Math.round(data.reflectionRatings.reduce((s, r) => s + r.rating * r.count, 0) / data.reflectionRatings.reduce((s, r) => s + r.count, 0) * 10) / 10
                  : '—'}
                subtitle={`${data.reflectionRatings.reduce((s, r) => s + r.count, 0)} total ratings`}
              />
            </section>

            {/* ── Skills + Category + Status ──────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Goals by Skill */}
              <ChartCard title="Goals by Skill" className="lg:col-span-2">
                {data.goalsBySkill.length === 0 ? (
                  <div className="flex items-center justify-center h-64 text-sm text-deco-text-tertiary">No skill-linked goals yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={Math.max(200, data.goalsBySkill.length * 36)}>
                    <BarChart
                      data={data.goalsBySkill}
                      layout="vertical"
                      margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                      <XAxis type="number" tick={tickStyle} axisLine={false} tickLine={false} allowDecimals={false} />
                      <YAxis type="category" dataKey="skill" tick={tickStyle} axisLine={false} tickLine={false} width={150} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }} />
                      <Bar dataKey="count" name="Goals" radius={[0, 4, 4, 0]} maxBarSize={22}>
                        {data.goalsBySkill.map((entry, i) => (
                          <Cell key={i} fill={CATEGORY_COLORS[entry.category] ?? '#9CA3AF'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
                {/* Category legend */}
                <div className="flex flex-wrap gap-4 mt-3 px-1">
                  {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
                    <span key={cat} className="flex items-center gap-1.5 text-xs text-deco-text-secondary">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                      {fmtCategory(cat)}
                    </span>
                  ))}
                </div>
              </ChartCard>

              {/* Status + Quality donuts */}
              <div className="flex flex-col gap-6">
                <ChartCard title="Goal Status">
                  <div className="flex flex-col items-center gap-3 py-2">
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart>
                        <Pie data={statusPie} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                          {statusPie.map((e) => (
                            <Cell key={e.name} fill={STATUS_COLORS[e.name.toLowerCase()] ?? '#9CA3AF'} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <ul className="flex flex-col gap-1 w-full px-2">
                      {statusPie.map((e) => (
                        <li key={e.name} className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[e.name.toLowerCase()] }} />
                            <span className="text-deco-text-secondary">{e.name}</span>
                          </span>
                          <span className="font-semibold text-deco-text">{e.value}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </ChartCard>

                <ChartCard title="Goal Quality (AI Score)">
                  <div className="flex flex-col items-center gap-3 py-2">
                    {qualityPie.length === 0 ? (
                      <div className="flex items-center justify-center h-32 text-sm text-deco-text-tertiary">No AI scores</div>
                    ) : (
                      <>
                        <ResponsiveContainer width="100%" height={140}>
                          <PieChart>
                            <Pie data={qualityPie} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                              {qualityPie.map((e) => (
                                <Cell key={e.name} fill={e.color} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }} />
                          </PieChart>
                        </ResponsiveContainer>
                        <ul className="flex flex-col gap-1 w-full px-2">
                          {qualityPie.map((e) => (
                            <li key={e.name} className="flex items-center justify-between text-xs">
                              <span className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: e.color }} />
                                <span className="text-deco-text-secondary">{e.name}</span>
                              </span>
                              <span className="font-semibold text-deco-text">{e.value}</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                </ChartCard>
              </div>
            </div>

            {/* ── Reflection Ratings Distribution ─────────────────────── */}
            {data.reflectionRatings.length > 0 && (
              <ChartCard title="Self-Assessment Ratings Distribution" subtitle="How athletes rate their own goal progress (1-10)">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.reflectionRatings} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis dataKey="rating" tick={tickStyle} axisLine={false} tickLine={false} />
                    <YAxis tick={tickStyle} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }} />
                    <Bar dataKey="count" name="Ratings" fill="#A78BFA" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {/* ── Tab toggle: Goals / Reflections ─────────────────────── */}
            <div className="flex gap-2">
              <button
                onClick={() => setTab('goals')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tab === 'goals' ? 'bg-deco-primary text-white' : 'bg-deco-surface text-deco-text-secondary border border-deco-border hover:bg-deco-bg'
                }`}
              >
                All Goals ({data.topGoalTexts.length})
              </button>
              <button
                onClick={() => setTab('reflections')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tab === 'reflections' ? 'bg-deco-primary text-white' : 'bg-deco-surface text-deco-text-secondary border border-deco-border hover:bg-deco-bg'
                }`}
              >
                All Reflections ({data.reflectionsList.length})
              </button>
            </div>

            {/* ── Goals Table ──────────────────────────────────────────── */}
            {tab === 'goals' && (
              <section aria-label="All goals">
                <div className="w-full overflow-x-auto rounded-xl border border-deco-border">
                  <table className="min-w-full text-sm" role="table">
                    <thead>
                      <tr className="bg-deco-bg border-b border-deco-border">
                        {['Athlete', 'Goal', 'Skill', 'Status', 'Spec', 'Meas', 'Chal', 'Reflections', 'Coach', 'Date'].map((h) => (
                          <th key={h} scope="col" className="px-3 py-3 text-xs font-semibold text-deco-text-secondary uppercase tracking-wide whitespace-nowrap text-left">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.topGoalTexts.map((g, i) => (
                        <tr
                          key={g.id}
                          className={[
                            'border-b border-deco-border last:border-0 hover:bg-deco-bg/60',
                            i % 2 === 0 ? 'bg-deco-surface' : 'bg-deco-bg/40',
                          ].join(' ')}
                        >
                          <td className="px-3 py-2.5 text-deco-text whitespace-nowrap">{g.athlete_name}</td>
                          <td className="px-3 py-2.5 text-deco-text max-w-[240px]">
                            <div className="font-medium truncate" title={g.description}>{g.title}</div>
                            {g.ai_feedback && (
                              <div className="text-xs text-deco-text-tertiary mt-0.5 truncate max-w-[240px]" title={g.ai_feedback}>
                                AI: {g.ai_feedback}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            {g.skill_label ? (
                              <span className="inline-flex items-center gap-1.5 text-xs">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[g.skill_category ?? ''] ?? '#9CA3AF' }} />
                                {g.skill_label}
                              </span>
                            ) : <span className="text-deco-text-tertiary">—</span>}
                          </td>
                          <td className="px-3 py-2.5"><StatusBadge status={g.status} /></td>
                          <td className="px-3 py-2.5"><ScoreDot value={g.specificity} /></td>
                          <td className="px-3 py-2.5"><ScoreDot value={g.measurability} /></td>
                          <td className="px-3 py-2.5"><ScoreDot value={g.challenge} /></td>
                          <td className="px-3 py-2.5 text-deco-text tabular-nums">
                            {g.reflection_count > 0 ? (
                              <span>{g.reflection_count} {g.avg_rating != null && <span className="text-deco-text-tertiary">(avg {g.avg_rating})</span>}</span>
                            ) : <span className="text-deco-text-tertiary">0</span>}
                          </td>
                          <td className="px-3 py-2.5 text-deco-text tabular-nums">
                            {g.coach_comments_count > 0 ? (
                              <span className="inline-flex items-center gap-1">
                                {g.coach_comments_count}
                                {g.has_thumbs_up && <span title="Thumbs up">👍</span>}
                              </span>
                            ) : <span className="text-deco-text-tertiary">0</span>}
                          </td>
                          <td className="px-3 py-2.5 text-deco-text-secondary whitespace-nowrap text-xs">{fmtDate(g.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* ── Reflections Table ────────────────────────────────────── */}
            {tab === 'reflections' && (
              <section aria-label="All reflections">
                <div className="w-full overflow-x-auto rounded-xl border border-deco-border">
                  <table className="min-w-full text-sm" role="table">
                    <thead>
                      <tr className="bg-deco-bg border-b border-deco-border">
                        {['Athlete', 'Type', 'Notes', 'Goal Ratings', 'Date'].map((h) => (
                          <th key={h} scope="col" className="px-3 py-3 text-xs font-semibold text-deco-text-secondary uppercase tracking-wide whitespace-nowrap text-left">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.reflectionsList.map((r, i) => (
                        <tr
                          key={r.id}
                          className={[
                            'border-b border-deco-border last:border-0 hover:bg-deco-bg/60',
                            i % 2 === 0 ? 'bg-deco-surface' : 'bg-deco-bg/40',
                          ].join(' ')}
                        >
                          <td className="px-3 py-2.5 text-deco-text whitespace-nowrap">{r.athlete_name}</td>
                          <td className="px-3 py-2.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              r.session_type === 'match' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'
                            }`}>
                              {r.session_type}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-deco-text max-w-[300px]">
                            {r.notes ? (
                              <div className="truncate" title={r.notes}>{r.notes}</div>
                            ) : <span className="text-deco-text-tertiary italic">No notes</span>}
                          </td>
                          <td className="px-3 py-2.5">
                            {r.goal_ratings && r.goal_ratings.length > 0 ? (
                              <div className="flex flex-col gap-0.5">
                                {r.goal_ratings.map((gr, j) => (
                                  <span key={j} className="text-xs">
                                    <span className="text-deco-text-secondary truncate max-w-[120px] inline-block align-bottom">{gr.goal_title}</span>
                                    {' '}
                                    <span className="font-semibold tabular-nums" style={{ color: gr.rating >= 7 ? '#2D9B6A' : gr.rating >= 4 ? '#F5A623' : '#EF4444' }}>
                                      {gr.rating}/10
                                    </span>
                                  </span>
                                ))}
                              </div>
                            ) : <span className="text-deco-text-tertiary text-xs">No ratings</span>}
                          </td>
                          <td className="px-3 py-2.5 text-deco-text-secondary whitespace-nowrap text-xs">{fmtDate(r.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
