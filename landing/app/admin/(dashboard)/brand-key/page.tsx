'use client';

/**
 * Admin — Brand Key
 *
 * Displays the Deco Brand Key model as an editable layered diagram.
 * Each layer card is editable inline. Changes are persisted to Supabase
 * via PUT /api/admin/brand-key.
 *
 * Brand Key layers (outer → inner):
 *   Omgeving (Environment)  — Markt · Situatie · Concurrentie
 *   Consumer Insight
 *   Brand Values
 *   Personality
 *   Reason to Believe
 *   Discriminator
 *   Merkessentie (Brand Essence)  ← core
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import Sidebar from '@/components/admin/Sidebar';

// ── Types ─────────────────────────────────────────────────────────────────────

interface BrandKey {
  id: number;
  markt: string;
  situatie: string;
  concurrentie: string;
  consumer_insight: string;
  brand_values: string[];
  personality: string;
  reason_to_believe: string[];
  discriminator: string;
  merkessentie: string;
  updated_at: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Parse a textarea value that has one item per line into a string array. */
function parseLines(val: string): string[] {
  return val
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

/** Join a string array back into one item per line for a textarea. */
function joinLines(arr: string[]): string {
  return arr.join('\n');
}

// ── Sub-components ─────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
}

function EditField({ label, value, onChange, multiline = true, rows = 3, placeholder }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-deco-text-secondary uppercase tracking-wide">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className="w-full rounded-lg border border-deco-border bg-white px-3 py-2 text-sm text-deco-text placeholder:text-deco-text-tertiary focus:outline-none focus:ring-2 focus:ring-deco-primary/40 resize-y transition"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-deco-border bg-white px-3 py-2 text-sm text-deco-text placeholder:text-deco-text-tertiary focus:outline-none focus:ring-2 focus:ring-deco-primary/40 transition"
        />
      )}
    </div>
  );
}

interface LayerCardProps {
  title: string;
  subtitle?: string;
  accent: string;       // Tailwind bg class for the left-border accent
  children: React.ReactNode;
}

function LayerCard({ title, subtitle, accent, children }: LayerCardProps) {
  return (
    <article
      className={`rounded-xl border border-deco-border bg-deco-surface shadow-sm overflow-hidden`}
    >
      {/* Coloured top stripe */}
      <div className={`h-1 w-full ${accent}`} aria-hidden="true" />
      <div className="p-5 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-deco-text tracking-tight">{title}</h2>
          {subtitle && (
            <p className="text-xs text-deco-text-tertiary mt-0.5">{subtitle}</p>
          )}
        </div>
        {children}
      </div>
    </article>
  );
}

// ── Brand Key Diagram ─────────────────────────────────────────────────────────
// A visual concentric-ring diagram showing the layers from outer to inner.

interface DiagramProps {
  bk: BrandKey;
}

function BrandKeyDiagram({ bk }: DiagramProps) {
  const layers = [
    { label: 'Omgeving', color: '#D1FAE5', text: '#065F46' },
    { label: 'Consumer Insight', color: '#A7F3D0', text: '#047857' },
    { label: 'Brand Values', color: '#6EE7B7', text: '#065F46' },
    { label: 'Personality', color: '#34D399', text: '#064E3B' },
    { label: 'RTB', color: '#10B981', text: '#ffffff' },
    { label: 'Discriminator', color: '#059669', text: '#ffffff' },
    { label: 'Essentie', color: '#1B6B4A', text: '#F5A623' },
  ];

  return (
    <div className="relative flex items-center justify-center py-6" aria-hidden="true">
      {/* Concentric rings rendered largest-to-smallest */}
      {layers.map((layer, i) => {
        const size = 340 - i * 42;
        return (
          <div
            key={layer.label}
            className="absolute flex items-center justify-center rounded-full"
            style={{
              width: size,
              height: size,
              backgroundColor: layer.color,
            }}
          />
        );
      })}
      {/* Labels positioned on top */}
      <div className="relative z-10 flex flex-col items-center gap-0 text-center" style={{ width: 340, height: 340 }}>
        {/* We overlay labels at approximate ring positions */}
        {layers.map((layer, i) => {
          // Position each label roughly at its ring radius from center
          const radius = (340 - i * 42) / 2 - 12;
          const angle = -90 + i * (180 / (layers.length - 1));
          const x = 170 + radius * Math.cos((angle * Math.PI) / 180);
          const y = 170 + radius * Math.sin((angle * Math.PI) / 180);
          const isCore = i === layers.length - 1;
          return (
            <span
              key={layer.label}
              className="absolute text-xs font-semibold whitespace-nowrap"
              style={{
                left: x,
                top: y,
                transform: 'translate(-50%, -50%)',
                color: layer.text,
                fontSize: isCore ? 11 : 10,
              }}
            >
              {isCore ? bk.merkessentie : layer.label}
            </span>
          );
        })}
      </div>
      {/* Invisible spacer to make container tall enough */}
      <div style={{ width: 340, height: 340 }} />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BrandKeyPage() {
  const [bk, setBk] = useState<BrandKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/brand-key', { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setBk(json as BrandKey);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load brand key');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    return () => {
      if (successTimer.current) clearTimeout(successTimer.current);
    };
  }, [fetchData]);

  // ── Field helpers ────────────────────────────────────────────────────────

  function update<K extends keyof BrandKey>(key: K, value: BrandKey[K]) {
    setBk((prev) => (prev ? { ...prev, [key]: value } : prev));
    setSaveSuccess(false);
  }

  // ── Save ─────────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!bk) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/brand-key', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markt:            bk.markt,
          situatie:         bk.situatie,
          concurrentie:     bk.concurrentie,
          consumer_insight: bk.consumer_insight,
          brand_values:     bk.brand_values,
          personality:      bk.personality,
          reason_to_believe: bk.reason_to_believe,
          discriminator:    bk.discriminator,
          merkessentie:     bk.merkessentie,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      const updated = await res.json();
      setBk(updated as BrandKey);
      setSaveSuccess(true);
      successTimer.current = setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen bg-deco-bg">
      <Sidebar />

      <main className="flex-1 ml-60 p-8 min-w-0" id="main-content">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-deco-text tracking-tight">Brand Key</h1>
            <p className="text-sm text-deco-text-secondary mt-1">
              Het merkmodel van Deco — van omgeving tot essentie
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {saveSuccess && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-700" role="status">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                Opgeslagen
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving || loading || !bk}
              className="inline-flex items-center gap-2 rounded-lg bg-deco-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-deco-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deco-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <>
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" />
                  </svg>
                  Opslaan...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  Opslaan
                </>
              )}
            </button>
          </div>
        </header>

        {/* ── Error banner ─────────────────────────────────────────────────── */}
        {error && (
          <div role="alert" className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="shrink-0">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {/* ── Loading skeleton ──────────────────────────────────────────────── */}
        {loading && (
          <div className="space-y-4" role="status" aria-label="Brand key laden...">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="rounded-xl border border-deco-border bg-deco-surface p-5 space-y-3" aria-hidden="true">
                <div className="h-3 w-32 rounded bg-deco-border animate-pulse" />
                <div className="h-4 w-full rounded bg-deco-border animate-pulse" />
                <div className="h-4 w-3/4 rounded bg-deco-border animate-pulse" />
              </div>
            ))}
          </div>
        )}

        {/* ── Main content ──────────────────────────────────────────────────── */}
        {!loading && bk && (
          <div className="space-y-6">

            {/* ── Visual diagram ───────────────────────────────────────────── */}
            <div className="rounded-xl border border-deco-border bg-deco-surface shadow-sm p-6">
              <h2 className="text-sm font-bold text-deco-text mb-1">Brand Key Model</h2>
              <p className="text-xs text-deco-text-tertiary mb-4">
                Visuele weergave van de merklagen — van omgeving (buiten) naar essentie (kern)
              </p>
              <BrandKeyDiagram bk={bk} />
              {bk.updated_at && (
                <p className="text-xs text-deco-text-tertiary text-right mt-2">
                  Laatste update:{' '}
                  {new Date(bk.updated_at).toLocaleString('nl-NL', {
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              )}
            </div>

            {/* ── Brand Essence (core) ─────────────────────────────────────── */}
            <LayerCard
              title="Merkessentie"
              subtitle="De kern van het merk — de ziel in een zin"
              accent="bg-deco-primary"
            >
              <EditField
                label="Merkessentie"
                value={bk.merkessentie}
                onChange={(v) => update('merkessentie', v)}
                multiline={false}
                placeholder='"Onthoud elk ontwikkelpunt."'
              />
            </LayerCard>

            {/* ── Discriminator ────────────────────────────────────────────── */}
            <LayerCard
              title="Discriminator"
              subtitle="Wat maakt Deco uniek ten opzichte van alternatieven?"
              accent="bg-[#059669]"
            >
              <EditField
                label="Discriminator"
                value={bk.discriminator}
                onChange={(v) => update('discriminator', v)}
                rows={4}
              />
            </LayerCard>

            {/* ── Reason to Believe ────────────────────────────────────────── */}
            <LayerCard
              title="Reason to Believe"
              subtitle="Concrete bewijspunten die het merk ondersteunen"
              accent="bg-[#10B981]"
            >
              <EditField
                label="Bewijspunten (één per regel)"
                value={joinLines(bk.reason_to_believe)}
                onChange={(v) => update('reason_to_believe', parseLines(v))}
                rows={6}
                placeholder="Elk bewijspunt op een nieuwe regel..."
              />
              {/* Preview list */}
              {bk.reason_to_believe.length > 0 && (
                <ul className="mt-1 space-y-1.5" aria-label="Reason to believe preview">
                  {bk.reason_to_believe.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-deco-text">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#10B981] shrink-0" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </LayerCard>

            {/* ── Personality ──────────────────────────────────────────────── */}
            <LayerCard
              title="Personality"
              subtitle="Het karakter en de toon van het merk"
              accent="bg-[#34D399]"
            >
              <EditField
                label="Persoonlijkheid"
                value={bk.personality}
                onChange={(v) => update('personality', v)}
                rows={4}
              />
            </LayerCard>

            {/* ── Brand Values ─────────────────────────────────────────────── */}
            <LayerCard
              title="Brand Values"
              subtitle="De kernwaarden die het merk drijven"
              accent="bg-[#6EE7B7]"
            >
              <EditField
                label="Waarden (één per regel)"
                value={joinLines(bk.brand_values)}
                onChange={(v) => update('brand_values', parseLines(v))}
                rows={6}
                placeholder="Elke waarde op een nieuwe regel..."
              />
              {/* Preview list */}
              {bk.brand_values.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-2" aria-label="Brand values preview">
                  {bk.brand_values.map((val, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center rounded-full bg-[#D1FAE5] px-3 py-1 text-xs font-medium text-[#065F46]"
                    >
                      {val}
                    </span>
                  ))}
                </div>
              )}
            </LayerCard>

            {/* ── Consumer Insight ─────────────────────────────────────────── */}
            <LayerCard
              title="Consumer Insight"
              subtitle="De diepe waarheid over de doelgroep die het merk activeert"
              accent="bg-[#A7F3D0]"
            >
              <EditField
                label="Insight"
                value={bk.consumer_insight}
                onChange={(v) => update('consumer_insight', v)}
                rows={4}
              />
            </LayerCard>

            {/* ── Omgeving ─────────────────────────────────────────────────── */}
            <LayerCard
              title="Omgeving"
              subtitle="De markt, situatie en concurrentie waarin Deco opereert"
              accent="bg-[#D1FAE5]"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <EditField
                  label="Markt"
                  value={bk.markt}
                  onChange={(v) => update('markt', v)}
                  rows={4}
                />
                <EditField
                  label="Situatie"
                  value={bk.situatie}
                  onChange={(v) => update('situatie', v)}
                  rows={4}
                />
                <EditField
                  label="Concurrentie"
                  value={bk.concurrentie}
                  onChange={(v) => update('concurrentie', v)}
                  rows={4}
                />
              </div>
            </LayerCard>

            {/* ── Bottom save bar ───────────────────────────────────────────── */}
            <div className="sticky bottom-0 bg-deco-bg/80 backdrop-blur border-t border-deco-border -mx-8 px-8 py-4 flex items-center justify-between gap-4">
              <p className="text-xs text-deco-text-tertiary">
                Wijzigingen worden direct opgeslagen in Supabase wanneer je op Opslaan klikt.
              </p>
              <div className="flex items-center gap-3">
                {saveSuccess && (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-700" role="status">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                    Opgeslagen
                  </span>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving || !bk}
                  className="inline-flex items-center gap-2 rounded-lg bg-deco-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-deco-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deco-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Opslaan...' : 'Opslaan'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
