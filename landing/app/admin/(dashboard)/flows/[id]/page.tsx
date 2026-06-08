'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

// ── Types ──────────────────────────────────────────────────────────────────────

interface FlowStep {
  id?: string;
  step_order: number;
  delay_hours: number;
  title_nl: string;
  title_en: string;
  body_nl: string;
  body_en: string;
  screen_path: string;
}

interface Flow {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  trigger_type: string;
  trigger_config: Record<string, number>;
  target_role: 'athlete' | 'coach' | null;
  exit_on_activity: boolean;
  steps: FlowStep[];
  stats: { enrolled: number; completed: number; exited_active: number };
}

type TriggerType =
  | 'inactivity'
  | 'new_signup'
  | 'no_goals'
  | 'no_reflections'
  | 'coach_inactive';

// ── Constants ──────────────────────────────────────────────────────────────────

const TRIGGER_OPTIONS: { value: TriggerType; label: string }[] = [
  { value: 'inactivity',     label: 'Inactivity' },
  { value: 'new_signup',     label: 'New Signup' },
  { value: 'no_goals',       label: 'No Goals' },
  { value: 'no_reflections', label: 'No Reflections' },
  { value: 'coach_inactive', label: 'Coach Inactive' },
];

const TRIGGER_CONFIG_META: Record<TriggerType, { key: string; label: string }> = {
  inactivity:     { key: 'days_inactive',           label: 'Days inactive' },
  coach_inactive: { key: 'days_inactive',           label: 'Days inactive' },
  new_signup:     { key: 'days_after_signup',       label: 'Days after signup' },
  no_goals:       { key: 'days_without_goals',      label: 'Days without goals' },
  no_reflections: { key: 'days_without_reflections', label: 'Days without reflections' },
};

const SCREEN_PATH_OPTIONS = [
  '/(athlete)/goals',
  '/(athlete)/goals/new',
  '/(athlete)/development',
  '/(athlete)/development/reflect',
  '/(athlete)/profile',
  '/(coach)/players',
  '/(coach)/reports',
];

const EMPTY_STEP = (): FlowStep => ({
  step_order: 0,
  delay_hours: 48,
  title_nl: '',
  title_en: '',
  body_nl: '',
  body_en: '',
  screen_path: '/(athlete)/goals',
});

// ── Shared UI primitives ───────────────────────────────────────────────────────

const inputClass =
  'w-full rounded-lg border border-deco-border bg-white px-3 py-2 text-sm text-deco-text focus:outline-none focus:ring-2 focus:ring-deco-primary/40';

const labelClass =
  'text-xs font-semibold text-deco-text-secondary uppercase tracking-wide';

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className={`${labelClass} block mb-1`}>
      {children}
    </label>
  );
}

function Toggle({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={[
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deco-primary',
        checked ? 'bg-emerald-500' : 'bg-deco-border',
      ].join(' ')}
    >
      <span
        aria-hidden="true"
        className={[
          'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition-transform duration-200',
          checked ? 'translate-x-4' : 'translate-x-0',
        ].join(' ')}
      />
    </button>
  );
}

// ── Step card ──────────────────────────────────────────────────────────────────

function StepCard({
  step,
  index,
  total,
  cumulativeDay,
  onChange,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  step: FlowStep;
  index: number;
  total: number;
  cumulativeDay: number;
  onChange: (updated: FlowStep) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}) {
  const isFirst = index === 0;
  const isLast = index === total - 1;

  const delayLabel =
    index === 0
      ? 'Immediately'
      : `+${step.delay_hours}h`;

  const dayLabel =
    index === 0
      ? 'After enrollment'
      : `Day ${cumulativeDay}`;

  function update(field: keyof FlowStep, value: string | number) {
    onChange({ ...step, [field]: value });
  }

  return (
    <div className="bg-white rounded-xl border border-deco-border p-4">
      <div className="flex items-start gap-3">
        {/* Step badge + delay */}
        <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-deco-primary text-white text-xs font-bold select-none">
            {index + 1}
          </div>
          <span className="text-xs font-semibold text-deco-text-secondary leading-tight text-center">
            {delayLabel}
          </span>
          <span className="text-[10px] text-deco-text-tertiary leading-tight text-center">
            {dayLabel}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Title row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor={`step-${index}-title-nl`}>Title NL</Label>
              <input
                id={`step-${index}-title-nl`}
                type="text"
                value={step.title_nl}
                onChange={(e) => update('title_nl', e.target.value)}
                placeholder="Titel (NL)"
                className={inputClass}
              />
            </div>
            <div>
              <Label htmlFor={`step-${index}-title-en`}>Title EN</Label>
              <input
                id={`step-${index}-title-en`}
                type="text"
                value={step.title_en}
                onChange={(e) => update('title_en', e.target.value)}
                placeholder="Title (EN)"
                className={inputClass}
              />
            </div>
          </div>

          {/* Body row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor={`step-${index}-body-nl`}>Body NL</Label>
              <textarea
                id={`step-${index}-body-nl`}
                value={step.body_nl}
                onChange={(e) => update('body_nl', e.target.value)}
                placeholder="Berichttekst (NL)"
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </div>
            <div>
              <Label htmlFor={`step-${index}-body-en`}>Body EN</Label>
              <textarea
                id={`step-${index}-body-en`}
                value={step.body_en}
                onChange={(e) => update('body_en', e.target.value)}
                placeholder="Message body (EN)"
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>

          {/* Screen path + delay */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor={`step-${index}-screen`}>Screen path</Label>
              <select
                id={`step-${index}-screen`}
                value={step.screen_path}
                onChange={(e) => update('screen_path', e.target.value)}
                className={inputClass}
              >
                {SCREEN_PATH_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor={`step-${index}-delay`}>
                Delay (hours after previous step)
              </Label>
              <input
                id={`step-${index}-delay`}
                type="number"
                min={0}
                value={step.delay_hours}
                onChange={(e) => update('delay_hours', Number(e.target.value))}
                className={inputClass}
                disabled={index === 0}
              />
              {index === 0 && (
                <p className="text-[10px] text-deco-text-tertiary mt-1">
                  First step always sends immediately
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-1 shrink-0">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            aria-label="Move step up"
            className="rounded-md border border-deco-border bg-white p-1.5 text-deco-text-secondary hover:bg-deco-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deco-primary"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            aria-label="Move step down"
            className="rounded-md border border-deco-border bg-white p-1.5 text-deco-text-secondary hover:bg-deco-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deco-primary"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label="Delete step"
            className="rounded-md border border-red-200 bg-red-50 p-1.5 text-red-600 hover:bg-red-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function FlowEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isNew = id === 'new';

  // ── State ─────────────────────────────────────────────────────────────────

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Flow fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState<TriggerType>('inactivity');
  const [triggerConfigValue, setTriggerConfigValue] = useState<number>(3);
  const [targetRole, setTargetRole] = useState<'athlete' | 'coach' | ''>('');
  const [exitOnActivity, setExitOnActivity] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [steps, setSteps] = useState<FlowStep[]>([]);
  const [stats, setStats] = useState<Flow['stats'] | null>(null);

  // ── Derived ───────────────────────────────────────────────────────────────

  const triggerMeta = TRIGGER_CONFIG_META[triggerType];

  // Cumulative days for each step
  const cumulativeDays = steps.reduce<number[]>((acc, step, i) => {
    if (i === 0) return [0];
    const prevCumulative = acc[i - 1];
    return [...acc, prevCumulative + step.delay_hours / 24];
  }, []);

  const timelineSummary = cumulativeDays
    .map((d) => `Day ${Math.round(d)}`)
    .join(' → ');

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchFlow = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(`/api/admin/flows/${id}`, { credentials: 'include' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as Flow;
      setName(data.name);
      setDescription(data.description ?? '');
      setTriggerType(data.trigger_type as TriggerType);
      const meta = TRIGGER_CONFIG_META[data.trigger_type as TriggerType];
      setTriggerConfigValue(data.trigger_config[meta.key] ?? 3);
      setTargetRole(data.target_role ?? '');
      setExitOnActivity(data.exit_on_activity);
      setIsActive(data.is_active);
      setSteps(
        (data.steps ?? []).map((s, i) => ({ ...s, step_order: i }))
      );
      setStats(data.stats);
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : 'Failed to load flow');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!isNew) {
      fetchFlow();
    }
  }, [isNew, fetchFlow]);

  // ── Trigger type change: reset config value ───────────────────────────────

  function handleTriggerTypeChange(type: TriggerType) {
    setTriggerType(type);
    setTriggerConfigValue(3);
  }

  // ── Steps helpers ─────────────────────────────────────────────────────────

  function addStep() {
    const newStep = EMPTY_STEP();
    newStep.step_order = steps.length;
    setSteps((prev) => [...prev, newStep]);
  }

  function updateStep(index: number, updated: FlowStep) {
    setSteps((prev) => prev.map((s, i) => (i === index ? updated : s)));
  }

  function moveStep(index: number, direction: 'up' | 'down') {
    setSteps((prev) => {
      const next = [...prev];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((s, i) => ({ ...s, step_order: i }));
    });
  }

  function deleteStep(index: number) {
    setSteps((prev) =>
      prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, step_order: i }))
    );
  }

  // ── Build payload ─────────────────────────────────────────────────────────

  function buildFlowPayload() {
    const meta = TRIGGER_CONFIG_META[triggerType];
    return {
      name: name.trim(),
      description: description.trim() || null,
      trigger_type: triggerType,
      trigger_config: { [meta.key]: triggerConfigValue },
      target_role: targetRole || null,
      exit_on_activity: exitOnActivity,
      is_active: isActive,
    };
  }

  function buildStepsPayload() {
    return steps.map((s, i) => ({
      ...(s.id ? { id: s.id } : {}),
      step_order: i,
      delay_hours: i === 0 ? 0 : s.delay_hours,
      title_nl: s.title_nl,
      title_en: s.title_en,
      body_nl: s.body_nl,
      body_en: s.body_en,
      screen_path: s.screen_path,
    }));
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true);
    setSaveStatus('idle');
    setSaveError(null);

    try {
      let flowId = id;

      if (isNew) {
        // Create flow
        const res = await fetch('/api/admin/flows', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildFlowPayload()),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
        }
        const created = (await res.json()) as Flow;
        flowId = created.id;

        // Save steps
        await saveSteps(flowId);

        // Redirect to edit page
        router.replace(`/admin/flows/${flowId}`);
        return;
      }

      // Update existing flow
      const res = await fetch(`/api/admin/flows/${flowId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildFlowPayload()),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
      }

      await saveSteps(flowId);

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (e) {
      setSaveStatus('error');
      setSaveError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function saveSteps(flowId: string) {
    const res = await fetch(`/api/admin/flows/${flowId}/steps`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ steps: buildStepsPayload() }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/flows/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      router.push('/admin/flows');
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Delete failed');
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  }

  // ── Render: loading ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading flow...">
        <div className="flex items-center justify-between">
          <div className="h-7 bg-deco-border rounded w-48" />
          <div className="flex gap-2">
            <div className="h-9 w-24 bg-deco-border rounded-lg" />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-deco-border p-6 space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 bg-deco-border rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
      >
        <p className="font-semibold mb-0.5">Failed to load flow</p>
        <p>{fetchError}</p>
        <Link href="/admin/flows" className="mt-3 inline-block text-xs font-semibold underline">
          Back to Flows
        </Link>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const conversionRate =
    stats && stats.enrolled > 0
      ? `${((stats.completed / stats.enrolled) * 100).toFixed(1)}%`
      : '—';

  return (
    <div className="space-y-6 max-w-4xl">

      {/* ── Section 1: Header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/flows"
            className="inline-flex items-center gap-1 text-xs font-semibold text-deco-text-secondary hover:text-deco-text transition-colors mb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deco-primary rounded"
            aria-label="Back to Flows list"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Flows
          </Link>
          <h1 className="text-2xl font-bold text-deco-text tracking-tight">
            {isNew ? 'New Flow' : name || 'Edit Flow'}
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Save status indicator */}
          {saveStatus === 'saved' && (
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2" role="status">
              Saved
            </span>
          )}

          {/* Delete button (existing flows only) */}
          {!isNew && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleting}
              className="border border-red-200 bg-red-50 text-red-700 rounded-lg px-3 py-2 text-xs font-semibold hover:bg-red-100 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          )}

          {/* Save button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-deco-primary text-white rounded-lg px-4 py-2 font-semibold text-sm hover:bg-deco-primary-dark transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deco-primary"
          >
            {saving ? 'Saving…' : isNew ? 'Create Flow' : 'Save'}
          </button>
        </div>
      </div>

      {/* Error alert */}
      {saveStatus === 'error' && saveError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700"
        >
          <p className="font-semibold">Error</p>
          <p>{saveError}</p>
        </div>
      )}

      {/* ── Section 2: Settings card ───────────────────────────────────────── */}
      <section aria-labelledby="settings-heading">
        <div className="bg-white rounded-2xl border border-deco-border p-6 space-y-5">
          <h2 id="settings-heading" className="text-sm font-bold text-deco-text">
            Flow Settings
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Name */}
            <div>
              <Label htmlFor="flow-name">Name</Label>
              <input
                id="flow-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Inactivity Re-engagement"
                className={inputClass}
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="flow-description">Description</Label>
              <input
                id="flow-description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                className={inputClass}
              />
            </div>

            {/* Trigger type */}
            <div>
              <Label htmlFor="flow-trigger-type">Trigger type</Label>
              <select
                id="flow-trigger-type"
                value={triggerType}
                onChange={(e) => handleTriggerTypeChange(e.target.value as TriggerType)}
                className={inputClass}
              >
                {TRIGGER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Trigger config — dynamic field */}
            <div>
              <Label htmlFor="flow-trigger-config">{triggerMeta.label}</Label>
              <input
                id="flow-trigger-config"
                type="number"
                min={1}
                value={triggerConfigValue}
                onChange={(e) => setTriggerConfigValue(Number(e.target.value))}
                className={inputClass}
              />
            </div>

            {/* Target role */}
            <div>
              <Label htmlFor="flow-target-role">Target role</Label>
              <select
                id="flow-target-role"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value as 'athlete' | 'coach' | '')}
                className={inputClass}
              >
                <option value="">Any</option>
                <option value="athlete">Athlete</option>
                <option value="coach">Coach</option>
              </select>
            </div>
          </div>

          {/* Toggles row */}
          <div className="flex flex-wrap gap-6 pt-2 border-t border-deco-border">
            <div className="flex items-center gap-3">
              <Toggle
                checked={exitOnActivity}
                onChange={setExitOnActivity}
                ariaLabel="Exit on activity"
              />
              <div>
                <p className="text-sm font-semibold text-deco-text">Exit on activity</p>
                <p className="text-xs text-deco-text-secondary">
                  Remove user from flow when they become active
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Toggle
                checked={isActive}
                onChange={setIsActive}
                ariaLabel="Flow active"
              />
              <div>
                <p className="text-sm font-semibold text-deco-text">Active</p>
                <p className="text-xs text-deco-text-secondary">
                  New enrollments will be accepted
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3: Steps Timeline ─────────────────────────────────────── */}
      <section aria-labelledby="steps-heading">
        <div className="space-y-0">
          <div className="flex items-center justify-between mb-4">
            <h2 id="steps-heading" className="text-sm font-bold text-deco-text">
              Steps
              <span className="ml-2 text-xs font-normal text-deco-text-secondary">
                ({steps.length} step{steps.length !== 1 ? 's' : ''})
              </span>
            </h2>
          </div>

          {steps.length === 0 && (
            <div className="bg-white rounded-xl border border-deco-border border-dashed p-8 text-center">
              <p className="text-sm text-deco-text-secondary">
                No steps yet. Add your first step below.
              </p>
            </div>
          )}

          {/* Timeline */}
          <div className="space-y-0">
            {steps.map((step, index) => (
              <div key={step.id ?? `step-${index}`} className="relative">
                {/* Connecting line between cards */}
                {index < steps.length - 1 && (
                  <div
                    aria-hidden="true"
                    className="absolute left-[1.1875rem] top-full z-10 w-px bg-deco-border"
                    style={{ height: '1rem' }}
                  />
                )}
                <div className={index > 0 ? 'mt-4' : ''}>
                  <StepCard
                    step={step}
                    index={index}
                    total={steps.length}
                    cumulativeDay={Math.round(cumulativeDays[index] ?? 0)}
                    onChange={(updated) => updateStep(index, updated)}
                    onMoveUp={() => moveStep(index, 'up')}
                    onMoveDown={() => moveStep(index, 'down')}
                    onDelete={() => deleteStep(index)}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Add step */}
          <div className={steps.length > 0 ? 'mt-4' : 'mt-2'}>
            <button
              type="button"
              onClick={addStep}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-deco-border border-dashed bg-white px-4 py-3 text-sm font-semibold text-deco-text-secondary hover:border-deco-primary hover:text-deco-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deco-primary"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Step
            </button>
          </div>

          {/* Cumulative timeline preview */}
          {steps.length > 0 && (
            <div className="mt-4 rounded-xl border border-deco-border bg-white px-5 py-3">
              <p className={`${labelClass} mb-1`}>Timeline preview</p>
              <p className="text-xs font-mono text-deco-text">{timelineSummary}</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Section 4: Stats (existing flows only) ────────────────────────── */}
      {!isNew && stats && (
        <section aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="text-sm font-bold text-deco-text mb-3">
            Enrollment Stats
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-deco-border p-5">
              <p className={`${labelClass} mb-1.5`}>Enrolled</p>
              <p className="text-2xl font-bold text-deco-text leading-none">
                {stats.enrolled.toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-deco-border p-5">
              <p className={`${labelClass} mb-1.5`}>Completed</p>
              <p className="text-2xl font-bold text-deco-text leading-none">
                {stats.completed.toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-deco-border p-5">
              <p className={`${labelClass} mb-1.5`}>Exited (active)</p>
              <p className="text-2xl font-bold text-deco-text leading-none">
                {stats.exited_active.toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-deco-border p-5">
              <p className={`${labelClass} mb-1.5`}>Conversion</p>
              <p className="text-2xl font-bold text-deco-primary leading-none">
                {conversionRate}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── Delete confirm dialog ─────────────────────────────────────────── */}
      {showDeleteConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowDeleteConfirm(false)}
            aria-hidden="true"
          />
          {/* Panel */}
          <div className="relative z-10 bg-white rounded-2xl border border-deco-border p-6 w-full max-w-sm shadow-xl">
            <h2 id="delete-dialog-title" className="text-base font-bold text-deco-text mb-2">
              Delete flow?
            </h2>
            <p className="text-sm text-deco-text-secondary mb-5">
              This will permanently delete &ldquo;{name}&rdquo; and all its steps. Users currently
              enrolled will be exited. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg border border-deco-border bg-white px-4 py-2 text-sm font-semibold text-deco-text hover:bg-deco-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deco-primary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              >
                {deleting ? 'Deleting…' : 'Delete flow'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
