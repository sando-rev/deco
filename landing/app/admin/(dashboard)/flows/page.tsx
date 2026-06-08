'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Flow {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  trigger_type: 'inactivity' | 'new_signup' | 'no_goals' | 'no_reflections' | 'coach_inactive';
  trigger_config: Record<string, number>;
  target_role: 'athlete' | 'coach' | null;
  exit_on_activity: boolean;
  created_at: string;
  stats: { enrolled: number; completed: number; exited_active: number };
}

// ── Trigger type metadata ──────────────────────────────────────────────────────

const TRIGGER_META: Record<
  Flow['trigger_type'],
  { label: string; className: string }
> = {
  inactivity:       { label: 'Inactivity',       className: 'bg-red-100 text-red-700' },
  new_signup:       { label: 'New Signup',        className: 'bg-blue-100 text-blue-700' },
  no_goals:         { label: 'No Goals',          className: 'bg-amber-100 text-amber-700' },
  no_reflections:   { label: 'No Reflections',    className: 'bg-purple-100 text-purple-700' },
  coach_inactive:   { label: 'Coach Inactive',    className: 'bg-orange-100 text-orange-700' },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function conversionRate(stats: Flow['stats']): string {
  const total = stats.completed + stats.exited_active + stats.enrolled;
  if (total === 0) return '—';
  return `${((stats.completed / total) * 100).toFixed(1)}%`;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatBox({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white rounded-2xl border border-deco-border p-6">
      <p className="text-xs font-semibold text-deco-text-secondary uppercase tracking-wide mb-2">
        {label}
      </p>
      <p className="text-3xl font-bold text-deco-text tracking-tight leading-none">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </div>
  );
}

function TriggerBadge({ type }: { type: Flow['trigger_type'] }) {
  const meta = TRIGGER_META[type];
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

function ActiveToggle({
  flowId,
  isActive,
  onToggle,
}: {
  flowId: string;
  isActive: boolean;
  onToggle: (id: string, next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isActive}
      aria-label={isActive ? 'Deactivate flow' : 'Activate flow'}
      onClick={() => onToggle(flowId, !isActive)}
      className={[
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deco-primary',
        isActive ? 'bg-emerald-500' : 'bg-deco-border',
      ].join(' ')}
    >
      <span
        aria-hidden="true"
        className={[
          'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition-transform duration-200',
          isActive ? 'translate-x-4' : 'translate-x-0',
        ].join(' ')}
      />
    </button>
  );
}

function FlowCardSkeleton() {
  return (
    <div
      className="bg-white rounded-2xl border border-deco-border p-6 animate-pulse"
      aria-hidden="true"
    >
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0 space-y-3">
          <div className="h-4 bg-deco-border rounded w-2/5" />
          <div className="h-3 bg-deco-border rounded w-3/5" />
          <div className="h-5 bg-deco-border rounded-full w-24" />
        </div>
        <div className="flex gap-8 shrink-0">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div className="h-6 bg-deco-border rounded w-10" />
              <div className="h-3 bg-deco-border rounded w-14" />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          <div className="h-5 w-9 bg-deco-border rounded-full" />
          <div className="h-8 w-14 bg-deco-border rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function FlowCard({
  flow,
  onToggle,
}: {
  flow: Flow;
  onToggle: (id: string, next: boolean) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-deco-border p-6">
      <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
        {/* Left: name / description / badge */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-deco-text truncate">{flow.name}</p>
          {flow.description && (
            <p className="text-xs text-deco-text-secondary mt-0.5 line-clamp-2">
              {flow.description}
            </p>
          )}
          <div className="mt-2">
            <TriggerBadge type={flow.trigger_type} />
          </div>
        </div>

        {/* Center: stats */}
        <div className="flex gap-6 sm:gap-8 shrink-0">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xl font-bold text-deco-text leading-none">
              {flow.stats.enrolled.toLocaleString()}
            </span>
            <span className="text-xs text-deco-text-secondary uppercase tracking-wide font-semibold">
              Enrolled
            </span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xl font-bold text-deco-text leading-none">
              {flow.stats.completed.toLocaleString()}
            </span>
            <span className="text-xs text-deco-text-secondary uppercase tracking-wide font-semibold">
              Completed
            </span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xl font-bold text-deco-primary leading-none">
              {conversionRate(flow.stats)}
            </span>
            <span className="text-xs text-deco-text-secondary uppercase tracking-wide font-semibold">
              Conversion
            </span>
          </div>
        </div>

        {/* Right: toggle + edit */}
        <div className="flex items-center gap-3 shrink-0 sm:ml-4">
          <div className="flex flex-col items-center gap-1">
            <ActiveToggle
              flowId={flow.id}
              isActive={flow.is_active}
              onToggle={onToggle}
            />
            <span className="text-[10px] font-semibold text-deco-text-tertiary uppercase tracking-wide">
              {flow.is_active ? 'Active' : 'Off'}
            </span>
          </div>
          <Link
            href={`/admin/flows/${flow.id}`}
            className="bg-deco-primary text-white px-4 py-2 rounded-lg font-semibold text-xs hover:bg-deco-primary-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deco-primary"
          >
            Edit
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function FlowsPage() {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  const fetchFlows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/flows', { credentials: 'include' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as Flow[];
      setFlows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load flows');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlows();
  }, [fetchFlows]);

  const handleToggle = async (id: string, next: boolean) => {
    // Optimistic update
    setFlows((prev) =>
      prev.map((f) => (f.id === id ? { ...f, is_active: next } : f))
    );
    setTogglingIds((prev) => new Set(prev).add(id));

    try {
      const res = await fetch(`/api/admin/flows/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: next }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      // Refresh to get server-confirmed state
      await fetchFlows();
    } catch {
      // Revert optimistic update on failure
      setFlows((prev) =>
        prev.map((f) => (f.id === id ? { ...f, is_active: !next } : f))
      );
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // ── Derived stats ────────────────────────────────────────────────────────────

  const totalFlows = flows.length;
  const activeFlows = flows.filter((f) => f.is_active).length;
  const totalEnrolled = flows.reduce((sum, f) => sum + f.stats.enrolled, 0);
  const totalCompleted = flows.reduce((sum, f) => sum + f.stats.completed, 0);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-deco-text tracking-tight">
            Notification Flows
          </h1>
          <p className="text-sm text-deco-text-secondary mt-1">
            Automated multi-step notification sequences triggered by user behaviour.
          </p>
        </div>
        <Link
          href="/admin/flows/new"
          className="shrink-0 bg-deco-primary text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-deco-primary-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deco-primary"
        >
          Create Flow
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatBox label="Total Flows" value={totalFlows} />
        <StatBox label="Active Flows" value={activeFlows} />
        <StatBox label="Users Enrolled" value={totalEnrolled} />
        <StatBox label="Completions" value={totalCompleted} />
      </div>

      {/* Error state */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
        >
          <p className="font-semibold mb-0.5">Failed to load flows</p>
          <p>{error}</p>
        </div>
      )}

      {/* Flow list */}
      {loading ? (
        <div className="space-y-3" aria-label="Loading flows..." aria-busy="true">
          {[0, 1, 2].map((i) => (
            <FlowCardSkeleton key={i} />
          ))}
        </div>
      ) : !error && flows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-deco-border p-12 text-center">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto mb-4 text-deco-text-tertiary"
            aria-hidden="true"
          >
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.66A2 2 0 012 .99h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
          </svg>
          <p className="text-sm font-semibold text-deco-text mb-1">No flows yet</p>
          <p className="text-xs text-deco-text-secondary mb-5">
            Create your first notification flow to automatically re-engage users based on their
            activity.
          </p>
          <Link
            href="/admin/flows/new"
            className="inline-block bg-deco-primary text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-deco-primary-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deco-primary"
          >
            Create your first flow
          </Link>
        </div>
      ) : (
        !error && (
          <div className="space-y-3">
            {flows.map((flow) => (
              <FlowCard
                key={flow.id}
                flow={flow}
                onToggle={handleToggle}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}
