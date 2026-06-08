"use client";

/**
 * /admin/coaches — Coach analytics dashboard.
 *
 * Sections:
 *   - Stat row: Total Comments | Thumbs-up Rate | Score Feedbacks | Total Teams
 *   - BarChart: Coach comments over time
 *   - BarChart: Team sizes (member count per team)
 *   - DataTable: Most active coaches
 */

import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import StatCard from "@/components/admin/StatCard";
import ChartCard from "@/components/admin/ChartCard";
import TimeRangeSelector from "@/components/admin/TimeRangeSelector";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CommentsDataPoint {
  date: string;
  count: number;
}

interface ThumbsUpRate {
  total: number;
  thumbsUp: number;
  rate: number;
}

interface TeamSize {
  team_name: string;
  member_count: number;
  coach_count: number;
}

interface ActiveCoach {
  coach_id: string;
  full_name: string;
  comments_count: number;
  thumbs_ups: number;
  score_feedbacks: number;
}

interface CoachesData {
  commentsTimeseries: CommentsDataPoint[];
  thumbsUpRate: ThumbsUpRate;
  scoreFeedbackCount: number;
  teamSizes: TeamSize[];
  activeCoaches: ActiveCoach[];
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const CommentIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const ThumbsUpIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
    <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
  </svg>
);

const StarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const TeamsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

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

// ─── Custom tooltip ───────────────────────────────────────────────────────────

interface TooltipPayloadItem {
  value: number;
  name: string;
  color?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomBarTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-deco-surface border border-deco-border rounded-lg shadow-md px-3 py-2 text-xs">
      <p className="text-deco-text-secondary font-medium mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-deco-text font-semibold">
          {p.value.toLocaleString()} {p.name}
        </p>
      ))}
    </div>
  );
}

// ─── DataTable ────────────────────────────────────────────────────────────────

function CoachesTable({ coaches }: { coaches: ActiveCoach[] }) {
  if (coaches.length === 0) {
    return (
      <p className="text-sm text-deco-text-tertiary text-center py-8">
        No coach activity in this period.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm" role="table" aria-label="Most active coaches">
        <thead>
          <tr className="border-b border-deco-border">
            <th scope="col" className="text-left text-xs font-semibold text-deco-text-secondary py-2.5 px-3 whitespace-nowrap">
              Coach
            </th>
            <th scope="col" className="text-right text-xs font-semibold text-deco-text-secondary py-2.5 px-3 whitespace-nowrap">
              Comments
            </th>
            <th scope="col" className="text-right text-xs font-semibold text-deco-text-secondary py-2.5 px-3 whitespace-nowrap">
              Thumbs-ups
            </th>
            <th scope="col" className="text-right text-xs font-semibold text-deco-text-secondary py-2.5 px-3 whitespace-nowrap">
              Score Feedbacks
            </th>
            <th scope="col" className="text-right text-xs font-semibold text-deco-text-secondary py-2.5 px-3 whitespace-nowrap">
              Approval
            </th>
          </tr>
        </thead>
        <tbody>
          {coaches.map((coach, idx) => {
            const approvalRate =
              coach.comments_count > 0
                ? Math.round((coach.thumbs_ups / coach.comments_count) * 100)
                : 0;
            return (
              <tr
                key={coach.coach_id}
                className={`border-b border-deco-border/60 transition-colors hover:bg-deco-bg/60 ${idx % 2 === 0 ? "" : "bg-deco-bg/30"}`}
              >
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="flex-shrink-0 h-7 w-7 rounded-full bg-deco-primary/10 text-deco-primary text-xs font-bold flex items-center justify-center uppercase select-none"
                      aria-hidden="true"
                    >
                      {coach.full_name.charAt(0)}
                    </span>
                    <span className="font-medium text-deco-text truncate max-w-[160px]">
                      {coach.full_name}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-3 text-right font-semibold text-deco-text tabular-nums">
                  {coach.comments_count.toLocaleString()}
                </td>
                <td className="py-3 px-3 text-right font-semibold text-deco-text tabular-nums">
                  {coach.thumbs_ups.toLocaleString()}
                </td>
                <td className="py-3 px-3 text-right font-semibold text-deco-text tabular-nums">
                  {coach.score_feedbacks.toLocaleString()}
                </td>
                <td className="py-3 px-3 text-right">
                  <span
                    className={[
                      "inline-block text-xs font-semibold px-2 py-0.5 rounded-full",
                      approvalRate >= 75
                        ? "bg-emerald-50 text-emerald-700"
                        : approvalRate >= 50
                        ? "bg-amber-50 text-amber-700"
                        : "bg-red-50 text-red-600",
                    ].join(" ")}
                  >
                    {approvalRate}%
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CoachesPage() {
  const [range, setRange] = useState("30d");
  const [data, setData] = useState<CoachesData | null>(null);
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
      setData(json.coaches as CoachesData);
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
            Coach Analytics
          </h2>
          <p className="text-sm text-deco-text-secondary mt-0.5">
            Activity, feedback quality, and team composition
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : data ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Comments"
            value={data.thumbsUpRate.total}
            subtitle="Coach comments in period"
            icon={<CommentIcon />}
          />
          <StatCard
            title="Thumbs-up Rate"
            value={`${data.thumbsUpRate.rate}%`}
            subtitle={`${data.thumbsUpRate.thumbsUp.toLocaleString()} of ${data.thumbsUpRate.total.toLocaleString()} comments`}
            icon={<ThumbsUpIcon />}
          />
          <StatCard
            title="Score Feedbacks"
            value={data.scoreFeedbackCount}
            subtitle="Score feedback entries"
            icon={<StarIcon />}
          />
          <StatCard
            title="Total Teams"
            value={data.teamSizes.length}
            subtitle="Configured teams"
            icon={<TeamsIcon />}
          />
        </div>
      ) : null}

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Comments over time */}
        {loading ? (
          <SkeletonChart />
        ) : data ? (
          <ChartCard title="Coach Comments Over Time">
            {data.commentsTimeseries.length === 0 ? (
              <div className="flex items-center justify-center h-52 text-sm text-deco-text-tertiary">
                No comment data in this period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={data.commentsTimeseries}
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
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "rgba(27,107,74,0.06)" }} />
                  <Bar
                    dataKey="count"
                    name="comments"
                    fill="#2D9B6A"
                    radius={[3, 3, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        ) : null}

        {/* Team sizes */}
        {loading ? (
          <SkeletonChart />
        ) : data ? (
          <ChartCard title="Team Sizes">
            {data.teamSizes.length === 0 ? (
              <div className="flex items-center justify-center h-52 text-sm text-deco-text-tertiary">
                No team data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={data.teamSizes}
                  margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
                  layout="horizontal"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis
                    dataKey="team_name"
                    tick={{ fontSize: 11, fill: "#9CA3AF" }}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    tickFormatter={(v: string) =>
                      v.length > 10 ? `${v.slice(0, 10)}…` : v
                    }
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#9CA3AF" }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "rgba(27,107,74,0.06)" }} />
                  <Bar
                    dataKey="member_count"
                    name="members"
                    fill="#1B6B4A"
                    radius={[3, 3, 0, 0]}
                    maxBarSize={40}
                  />
                  <Bar
                    dataKey="coach_count"
                    name="coaches"
                    fill="#F5A623"
                    radius={[3, 3, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        ) : null}
      </div>

      {/* Active coaches table */}
      {loading ? (
        <SkeletonChart className="min-h-[200px]" />
      ) : data ? (
        <section className="bg-deco-surface rounded-xl shadow-sm border border-deco-border">
          <header className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-deco-border">
            <h2 className="text-sm font-semibold text-deco-text">Most Active Coaches</h2>
            <span className="text-xs text-deco-text-tertiary">
              {data.activeCoaches.length} coach{data.activeCoaches.length !== 1 ? "es" : ""}
            </span>
          </header>
          <div className="px-5 py-4">
            <CoachesTable coaches={data.activeCoaches} />
          </div>
        </section>
      ) : null}
    </div>
  );
}
