'use client';

/**
 * Admin — Power Users
 *
 * Segments athletes into power / retained / at_risk / churned / new,
 * then shows feature-adoption vs retention correlation, onboarding
 * completion by segment, time-to-first-action, and an athlete table.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import Sidebar from '@/components/admin/Sidebar';
import StatCard from '@/components/admin/StatCard';
import ChartCard from '@/components/admin/ChartCard';
import LoadingState from '@/components/admin/LoadingState';

// ── Types ────────────────────────────────────────────────────────────────────

interface SegmentAverage {
  segment: string;
  user_count: number;
  avg_goals: number;
  avg_reflections: number;
  avg_skills: number;
  avg_sessions: number;
  avg_xp: number;
  avg_achievements: number;
  avg_feature_breadth: number;
  avg_ai_goals: number;
  avg_coach_feedback: number;
}

interface OnboardingBySegment {
  segment: string;
  total: number;
  pct_onboarded: number;
  pct_selected_skills: number;
  pct_created_goal: number;
  pct_reflected: number;
  pct_scheduled_session: number;
  pct_earned_achievement: number;
}

interface FirstActionTimeline {
  segment: string;
  avg_days_to_first_goal: number | null;
  avg_days_to_first_reflection: number | null;
  avg_days_to_first_session: number | null;
}

interface FeatureCorrelation {
  feature: string;
  retention_rate_with: number;
  retention_rate_without: number;
  total_with_feature: number;
  total_without_feature: number;
}

interface AthleteRow {
  id: string;
  full_name: string;
  segment: string;
  account_age_days: number;
  days_since_active: number;
  goals_count: number;
  reflections_count: number;
  skills_selected: number;
  sessions_count: number;
  total_xp: number;
  achievements_count: number;
  feature_breadth: number;
}

interface PowerUsersData {
  segmentCounts: Record<string, number>;
  segmentAverages: SegmentAverage[];
  onboardingBySegment: OnboardingBySegment[];
  firstActionTimeline: FirstActionTimeline[];
  featureCorrelation: FeatureCorrelation[];
  athleteList: AthleteRow[];
}

// ── Palette ──────────────────────────────────────────────────────────────────

const SEGMENT_COLORS: Record<string, string> = {
  power: '#2D9B6A',
  retained: '#4F9EF5',
  at_risk: '#F5A623',
  churned: '#EF4444',
  new: '#9CA3AF',
};

const SEGMENT_LABELS: Record<string, string> = {
  power: 'Power',
  retained: 'Retained',
  at_risk: 'At Risk',
  churned: 'Churned',
  new: 'New (<14d)',
};

const tickStyle = { fill: '#9CA3AF', fontSize: 11 };

// ── Helpers ──────────────────────────────────────────────────────────────────

function SegmentBadge({ segment }: { segment: string }) {
  const color = SEGMENT_COLORS[segment] ?? '#9CA3AF';
  const label = SEGMENT_LABELS[segment] ?? segment;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: `${color}20`, color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export default function PowerUsersPage() {
  const [data, setData] = useState<PowerUsersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/data?range=all', { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json.powerUsers as PowerUsersData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const counts = data?.segmentCounts ?? {};
  const totalMature = (counts.power ?? 0) + (counts.retained ?? 0) + (counts.at_risk ?? 0) + (counts.churned ?? 0);

  // Build radar data: normalize each metric to 0-100 for comparison
  const radarData = (() => {
    if (!data?.segmentAverages.length) return [];
    const metrics = [
      { key: 'avg_goals', label: 'Goals' },
      { key: 'avg_reflections', label: 'Reflections' },
      { key: 'avg_skills', label: 'Skills' },
      { key: 'avg_sessions', label: 'Sessions' },
      { key: 'avg_achievements', label: 'Achievements' },
      { key: 'avg_feature_breadth', label: 'Feature Breadth' },
    ] as const;

    // Find max for each metric across segments for normalization
    const maxes: Record<string, number> = {};
    for (const m of metrics) {
      maxes[m.key] = Math.max(1, ...data.segmentAverages.map((s) => Number(s[m.key]) || 0));
    }

    return metrics.map((m) => {
      const row: Record<string, string | number> = { metric: m.label };
      for (const seg of data.segmentAverages) {
        row[seg.segment] = Math.round(((Number(seg[m.key]) || 0) / maxes[m.key]) * 100);
      }
      return row;
    });
  })();

  const segments = data?.segmentAverages.map((s) => s.segment) ?? [];

  // Onboarding steps for the grouped bar
  const onboardingSteps = [
    { key: 'pct_onboarded', label: 'Completed Onboarding' },
    { key: 'pct_selected_skills', label: 'Selected Skills' },
    { key: 'pct_created_goal', label: 'Created Goal' },
    { key: 'pct_reflected', label: 'Reflected' },
    { key: 'pct_scheduled_session', label: 'Scheduled Session' },
    { key: 'pct_earned_achievement', label: 'Earned Achievement' },
  ] as const;

  // Build onboarding comparison data
  const onboardingData = onboardingSteps.map((step) => {
    const row: Record<string, string | number> = { step: step.label };
    for (const seg of data?.onboardingBySegment ?? []) {
      row[seg.segment] = Number(seg[step.key]) || 0;
    }
    return row;
  });

  // Build first-action data
  const firstActionData = (data?.firstActionTimeline ?? []).map((seg) => ({
    segment: SEGMENT_LABELS[seg.segment] ?? seg.segment,
    'First Goal': seg.avg_days_to_first_goal != null ? Math.max(0, Number(seg.avg_days_to_first_goal)) : 0,
    'First Reflection': seg.avg_days_to_first_reflection != null ? Math.max(0, Number(seg.avg_days_to_first_reflection)) : 0,
    'First Session': seg.avg_days_to_first_session != null ? Math.max(0, Number(seg.avg_days_to_first_session)) : 0,
  }));

  return (
    <div className="flex min-h-screen bg-deco-bg">
      <Sidebar />

      <main className="flex-1 ml-60 p-8 min-w-0" id="main-content">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-deco-text tracking-tight">Power Users</h1>
          <p className="text-sm text-deco-text-secondary mt-1">
            What separates retained athletes from churned ones
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
            {/* Info banner when data is too young */}
            {totalMature < 5 && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-700">
                <strong>Early data:</strong> Most users are under 14 days old. Segment analysis will become more meaningful as the user base matures. Currently showing all {counts.new ?? 0} new users.
              </div>
            )}

            {/* ── Segment cards ──────────────────────────────────────────── */}
            <section aria-label="User segments" className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {(['power', 'retained', 'at_risk', 'churned', 'new'] as const).map((seg) => (
                <StatCard
                  key={seg}
                  title={SEGMENT_LABELS[seg]}
                  value={counts[seg] ?? 0}
                  subtitle={
                    seg !== 'new' && totalMature > 0
                      ? `${Math.round(((counts[seg] ?? 0) / totalMature) * 100)}% of mature users`
                      : seg === 'new'
                      ? 'Account < 14 days'
                      : 'No mature users yet'
                  }
                />
              ))}
            </section>

            {/* ── Feature Adoption vs Retention ───────────────────────── */}
            <ChartCard title="Feature Adoption vs Retention Rate" subtitle="Green = users who did this, Gray = users who did not">
              {data.featureCorrelation.every((f) => f.total_with_feature === 0 && f.total_without_feature === 0) ? (
                <div className="flex items-center justify-center h-64 text-sm text-deco-text-tertiary">
                  Not enough mature users for correlation analysis yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart
                    data={data.featureCorrelation}
                    layout="vertical"
                    margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={tickStyle} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="feature" tick={tickStyle} axisLine={false} tickLine={false} width={140} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }}
                      formatter={(val, name) => [`${val}%`, name === 'retention_rate_with' ? 'With feature' : 'Without feature']}
                    />
                    <Legend formatter={(val) => val === 'retention_rate_with' ? 'With feature' : 'Without feature'} />
                    <Bar dataKey="retention_rate_with" name="retention_rate_with" fill="#2D9B6A" radius={[0, 4, 4, 0]} maxBarSize={20} />
                    <Bar dataKey="retention_rate_without" name="retention_rate_without" fill="#D1D5DB" radius={[0, 4, 4, 0]} maxBarSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* ── Radar + Onboarding side by side ─────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Behavior Radar */}
              <ChartCard title="Behavior Profile by Segment">
                {radarData.length === 0 ? (
                  <div className="flex items-center justify-center h-64 text-sm text-deco-text-tertiary">
                    No segment data available yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                      <PolarGrid stroke="#E5E7EB" />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: '#6B7280' }} />
                      <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
                      {segments.map((seg) => (
                        <Radar
                          key={seg}
                          name={SEGMENT_LABELS[seg] ?? seg}
                          dataKey={seg}
                          stroke={SEGMENT_COLORS[seg] ?? '#9CA3AF'}
                          fill={SEGMENT_COLORS[seg] ?? '#9CA3AF'}
                          fillOpacity={0.1}
                          strokeWidth={2}
                        />
                      ))}
                      <Legend />
                      <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>

              {/* Onboarding Steps by Segment */}
              <ChartCard title="Onboarding Completion by Segment">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart
                    data={onboardingData}
                    layout="vertical"
                    margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={tickStyle} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="step" tick={{ ...tickStyle, fontSize: 10 }} axisLine={false} tickLine={false} width={130} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }}
                      formatter={(val, name) => [`${val}%`, SEGMENT_LABELS[name as string] ?? name]}
                    />
                    <Legend formatter={(val) => SEGMENT_LABELS[val] ?? val} />
                    {segments.map((seg) => (
                      <Bar
                        key={seg}
                        dataKey={seg}
                        name={seg}
                        fill={SEGMENT_COLORS[seg] ?? '#9CA3AF'}
                        radius={[0, 4, 4, 0]}
                        maxBarSize={14}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* ── Time to First Action ────────────────────────────────── */}
            <ChartCard title="Days from Signup to First Action" subtitle="How quickly each segment takes key actions">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={firstActionData} margin={{ top: 4, right: 16, left: -8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="segment" tick={tickStyle} axisLine={false} tickLine={false} />
                  <YAxis tick={tickStyle} axisLine={false} tickLine={false} label={{ value: 'Days', angle: -90, position: 'insideLeft', offset: 12, style: { fontSize: 11, fill: '#9CA3AF' } }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }} />
                  <Legend />
                  <Bar dataKey="First Goal" fill="#2D9B6A" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="First Reflection" fill="#0E9B8A" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="First Session" fill="#4F9EF5" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* ── Athlete Table ────────────────────────────────────────── */}
            <section aria-label="Athlete details">
              <h2 className="text-sm font-semibold text-deco-text mb-3">
                Athletes by XP{' '}
                <span className="text-deco-text-tertiary font-normal">(top {data.athleteList.length})</span>
              </h2>
              <div className="w-full overflow-x-auto rounded-xl border border-deco-border">
                <table className="min-w-full text-sm" role="table">
                  <thead>
                    <tr className="bg-deco-bg border-b border-deco-border">
                      {['Name', 'Segment', 'Age (d)', 'Inactive (d)', 'Goals', 'Reflections', 'Skills', 'Sessions', 'XP', 'Achievements', 'Breadth'].map((h) => (
                        <th key={h} scope="col" className="px-3 py-3 text-xs font-semibold text-deco-text-secondary uppercase tracking-wide whitespace-nowrap text-left">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.athleteList.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="px-4 py-10 text-center text-sm text-deco-text-tertiary">
                          No athletes found.
                        </td>
                      </tr>
                    ) : (
                      data.athleteList.map((a, i) => (
                        <tr
                          key={a.id}
                          className={[
                            'border-b border-deco-border last:border-0 transition-colors duration-100 hover:bg-deco-bg/60',
                            i % 2 === 0 ? 'bg-deco-surface' : 'bg-deco-bg/40',
                          ].join(' ')}
                        >
                          <td className="px-3 py-2.5 text-deco-text whitespace-nowrap font-medium">{a.full_name || '—'}</td>
                          <td className="px-3 py-2.5"><SegmentBadge segment={a.segment} /></td>
                          <td className="px-3 py-2.5 text-deco-text tabular-nums">{a.account_age_days}</td>
                          <td className="px-3 py-2.5 text-deco-text tabular-nums">{a.days_since_active}</td>
                          <td className="px-3 py-2.5 text-deco-text tabular-nums">{a.goals_count}</td>
                          <td className="px-3 py-2.5 text-deco-text tabular-nums">{a.reflections_count}</td>
                          <td className="px-3 py-2.5 text-deco-text tabular-nums">{a.skills_selected}</td>
                          <td className="px-3 py-2.5 text-deco-text tabular-nums">{a.sessions_count}</td>
                          <td className="px-3 py-2.5 text-deco-text tabular-nums font-semibold">{a.total_xp}</td>
                          <td className="px-3 py-2.5 text-deco-text tabular-nums">{a.achievements_count}</td>
                          <td className="px-3 py-2.5 text-deco-text tabular-nums">{a.feature_breadth}/5</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
