'use client';

import { useState, useEffect, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NotificationTemplate {
  id: string;
  type: string;
  variant: string;
  language: string;
  title: string;
  body: string;
  screen_path: string | null;
  updated_at: string | null;
}

interface AppScreen {
  path: string;
  label: string;
}

// Keyed by template id — stores the local edits
type DirtyMap = Record<string, Partial<NotificationTemplate>>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TYPE_LABELS: Record<string, string> = {
  session_focus: 'Pre-training Focus',
  post_training: 'Post-training Reflection',
  coach_feedback: 'Coach Feedback',
  weekly_review: 'Weekly Reflection',
  coach_report: 'Coach Weekly Report',
};

const LANG_LABELS: Record<string, string> = {
  nl: 'NL',
  en: 'EN',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function groupByType(templates: NotificationTemplate[]): Record<string, NotificationTemplate[]> {
  return templates.reduce<Record<string, NotificationTemplate[]>>((acc, t) => {
    if (!acc[t.type]) acc[t.type] = [];
    acc[t.type].push(t);
    return acc;
  }, {});
}

// Returns sorted type keys — known types first, then unknowns alphabetically
function sortedTypeKeys(grouped: Record<string, NotificationTemplate[]>): string[] {
  const knownOrder = Object.keys(TYPE_LABELS);
  const keys = Object.keys(grouped);
  return [
    ...knownOrder.filter((k) => keys.includes(k)),
    ...keys.filter((k) => !knownOrder.includes(k)).sort(),
  ];
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function LangBadge({ lang }: { lang: string }) {
  return (
    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-gray-100 text-gray-600 shrink-0">
      {LANG_LABELS[lang] ?? lang.toUpperCase()}
    </span>
  );
}

function VariantBadge({ variant }: { variant: string }) {
  if (variant === 'default') return null;
  return (
    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-deco-primary/10 text-deco-primary shrink-0">
      {variant}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Template Row
// ---------------------------------------------------------------------------

interface TemplateRowProps {
  template: NotificationTemplate;
  editing: boolean;
  dirty: Partial<NotificationTemplate> | undefined;
  appScreens: AppScreen[];
  onChange: (id: string, field: keyof NotificationTemplate, value: string) => void;
}

function TemplateRow({ template, editing, dirty, appScreens, onChange }: TemplateRowProps) {
  const current = { ...template, ...dirty };
  const isDirty = dirty && Object.keys(dirty).length > 0;

  return (
    <div
      className={`grid grid-cols-[auto_auto_1fr_1.6fr_1.2fr] gap-3 items-start py-3 px-4 border-t border-gray-100 first:border-t-0 transition-colors ${
        isDirty ? 'bg-amber-50/60' : ''
      }`}
    >
      {/* Language badge */}
      <div className="pt-0.5">
        <LangBadge lang={template.language} />
      </div>

      {/* Variant badge */}
      <div className="pt-0.5 min-w-[48px]">
        <VariantBadge variant={template.variant} />
      </div>

      {/* Title */}
      <div>
        <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">
          Title
        </label>
        {editing ? (
          <input
            type="text"
            value={current.title}
            onChange={(e) => onChange(template.id, 'title', e.target.value)}
            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-deco-primary focus:border-transparent"
          />
        ) : (
          <p className="text-sm text-gray-900 leading-snug">{current.title}</p>
        )}
      </div>

      {/* Body */}
      <div>
        <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">
          Body
        </label>
        {editing ? (
          <textarea
            value={current.body}
            onChange={(e) => onChange(template.id, 'body', e.target.value)}
            rows={3}
            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg resize-y focus:ring-2 focus:ring-deco-primary focus:border-transparent"
          />
        ) : (
          <p className="text-sm text-gray-600 leading-snug whitespace-pre-wrap">{current.body}</p>
        )}
      </div>

      {/* Screen path */}
      <div>
        <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">
          Screen
        </label>
        {editing ? (
          <select
            value={current.screen_path ?? ''}
            onChange={(e) => onChange(template.id, 'screen_path', e.target.value)}
            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-deco-primary focus:border-transparent"
          >
            <option value="">None</option>
            {appScreens.map((s) => (
              <option key={s.path} value={s.path}>
                {s.label}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-sm font-mono text-gray-500 leading-snug break-all">
            {current.screen_path || <span className="text-gray-300 not-italic font-sans">—</span>}
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Type Card
// ---------------------------------------------------------------------------

interface TypeCardProps {
  type: string;
  templates: NotificationTemplate[];
  appScreens: AppScreen[];
  dirty: DirtyMap;
  onChange: (id: string, field: keyof NotificationTemplate, value: string) => void;
}

function TypeCard({ type, templates, appScreens, dirty, onChange }: TypeCardProps) {
  const [editing, setEditing] = useState(false);
  const label = TYPE_LABELS[type] ?? type;
  const isCoachFeedback = type === 'coach_feedback';
  const cardHasDirty = templates.some((t) => dirty[t.id] && Object.keys(dirty[t.id]).length > 0);

  return (
    <div
      className={`rounded-xl border bg-white overflow-hidden transition-shadow ${
        cardHasDirty ? 'border-amber-300 shadow-sm' : 'border-gray-200'
      }`}
    >
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2.5">
          <h2 className="text-sm font-semibold text-gray-900">{label}</h2>
          <span className="text-xs text-gray-400 font-mono">{type}</span>
          {cardHasDirty && (
            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">
              unsaved
            </span>
          )}
        </div>

        <button
          onClick={() => setEditing((v) => !v)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            editing
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              : 'bg-deco-primary/10 text-deco-primary hover:bg-deco-primary/20'
          }`}
        >
          {editing ? 'Done' : 'Edit'}
        </button>
      </div>

      {/* Coach feedback note */}
      {isCoachFeedback && (
        <div className="px-4 py-2.5 bg-blue-50 border-b border-blue-100 text-xs text-blue-700">
          Use <code className="font-mono bg-blue-100 px-1 py-0.5 rounded">{'{{goal}}'}</code> as a
          placeholder — it is replaced with the athlete&apos;s goal title at send time.
        </div>
      )}

      {/* Column header labels (only visible when there is more than one template or for clarity) */}
      <div className="grid grid-cols-[auto_auto_1fr_1.6fr_1.2fr] gap-3 px-4 py-2 bg-gray-50/50 border-b border-gray-100">
        <div />
        <div />
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Title</span>
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Body</span>
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Screen</span>
      </div>

      {/* Template rows */}
      <div>
        {templates.map((t) => (
          <TemplateRow
            key={t.id}
            template={t}
            editing={editing}
            dirty={dirty[t.id]}
            appScreens={appScreens}
            onChange={onChange}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function NotificationTemplatesPage() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [appScreens, setAppScreens] = useState<AppScreen[]>([]);
  const [dirty, setDirty] = useState<DirtyMap>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    fetch('/api/admin/notifications/templates')
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({ error: `HTTP ${r.status}` }));
          throw new Error(err.error ?? `HTTP ${r.status}`);
        }
        return r.json();
      })
      .then((data) => {
        setTemplates(data.templates ?? []);
        setAppScreens(data.appScreens ?? []);
        setLoading(false);
      })
      .catch((err) => {
        setLoadError(err.message ?? 'Failed to load templates');
        setLoading(false);
      });
  }, []);

  const handleChange = useCallback(
    (id: string, field: keyof NotificationTemplate, value: string) => {
      setSaveResult(null);
      setDirty((prev) => ({
        ...prev,
        [id]: { ...prev[id], [field]: value },
      }));
    },
    []
  );

  const dirtyCount = Object.values(dirty).filter((d) => d && Object.keys(d).length > 0).length;

  const handleSave = async () => {
    if (dirtyCount === 0) return;
    setSaving(true);
    setSaveResult(null);

    // Build the list of templates to update — merge dirty fields on top of originals
    const toSave = templates
      .filter((t) => dirty[t.id] && Object.keys(dirty[t.id]).length > 0)
      .map((t) => ({ ...t, ...dirty[t.id] }));

    try {
      const res = await fetch('/api/admin/notifications/templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templates: toSave }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error ?? `Server error ${res.status}`);
      }

      // Merge dirty changes back into canonical template list and clear dirty state
      setTemplates((prev) =>
        prev.map((t) => (dirty[t.id] ? { ...t, ...dirty[t.id] } : t))
      );
      setDirty({});
      setSaveResult({ success: true, message: `Saved ${toSave.length} template${toSave.length !== 1 ? 's' : ''}.` });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setSaveResult({ success: false, message });
    } finally {
      setSaving(false);
    }
  };

  const handleDiscardAll = () => {
    setDirty({});
    setSaveResult(null);
  };

  // ---------------------------------------------------------------------------
  // Loading / error states
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-deco-primary" aria-label="Loading" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700 text-sm">
        <p className="font-semibold mb-1">Failed to load notification templates</p>
        <p>{loadError}</p>
      </div>
    );
  }

  const grouped = groupByType(templates);
  const typeKeys = sortedTypeKeys(grouped);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notification Templates</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Edit the default title, body, and destination screen for each automated notification.
          </p>
        </div>

        {/* Top action bar */}
        <div className="flex items-center gap-3">
          {dirtyCount > 0 && (
            <>
              <button
                onClick={handleDiscardAll}
                disabled={saving}
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Discard changes
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-deco-primary text-white text-sm font-semibold rounded-lg hover:bg-deco-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : `Save ${dirtyCount} template${dirtyCount !== 1 ? 's' : ''}`}
              </button>
            </>
          )}

          {saveResult && (
            <div
              className={`flex items-center gap-2 text-sm font-medium ${
                saveResult.success ? 'text-green-600' : 'text-red-600'
              }`}
            >
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${
                  saveResult.success ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              {saveResult.message}
            </div>
          )}
        </div>
      </div>

      {/* Template cards, one per type */}
      {typeKeys.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-400">
          No notification templates found in the database.
        </div>
      ) : (
        typeKeys.map((type) => (
          <TypeCard
            key={type}
            type={type}
            templates={grouped[type]}
            appScreens={appScreens}
            dirty={dirty}
            onChange={handleChange}
          />
        ))
      )}
    </div>
  );
}
