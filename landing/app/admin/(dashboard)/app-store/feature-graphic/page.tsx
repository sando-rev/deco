'use client';

import { useRef, useState, useCallback } from 'react';
import html2canvas from 'html2canvas-pro';

// ─── Constants ───────────────────────────────────────────────────────────────

const W = 1024;
const H = 500;
const PAD = 80; // minimum padding from edges

// ─── Radar chart (inline SVG, no deps) ───────────────────────────────────────

function FeatureRadarChart({ size = 220 }: { size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const attrs = ['Technisch', 'Tactisch', 'Fysiek', 'Mentaal', 'Passen', 'Dribbel', 'Visie', 'Leider'];
  const values = [7.5, 6.8, 8.2, 6.0, 7.0, 6.5, 5.5, 7.2];
  const n = attrs.length;

  const getPoint = (i: number, val: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const dist = (val / 10) * r;
    return [cx + dist * Math.cos(angle), cy + dist * Math.sin(angle)] as [number, number];
  };

  const gridLevels = [0.25, 0.5, 0.75, 1];
  const dataPoints = values.map((v, i) => getPoint(i, v));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + 'Z';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Glow behind data area */}
      <defs>
        <filter id="radar-glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="radar-fill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F5A623" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#F5A623" stopOpacity="0.08" />
        </radialGradient>
      </defs>

      {/* Grid polygons */}
      {gridLevels.map((level) => {
        const pts = Array.from({ length: n }, (_, i) => getPoint(i, level * 10));
        return (
          <polygon
            key={level}
            points={pts.map((p) => p.join(',')).join(' ')}
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={1}
          />
        );
      })}

      {/* Axes */}
      {Array.from({ length: n }, (_, i) => {
        const [x, y] = getPoint(i, 10);
        return (
          <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
        );
      })}

      {/* Data fill */}
      <path d={dataPath} fill="url(#radar-fill)" filter="url(#radar-glow)" />

      {/* Data stroke */}
      <path d={dataPath} fill="none" stroke="#F5A623" strokeWidth={2.5} strokeLinejoin="round" />

      {/* Data dots */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={4} fill="#F5A623" stroke="white" strokeWidth={1.5} />
      ))}

      {/* Labels */}
      {attrs.map((label, i) => {
        const [x, y] = getPoint(i, 13);
        return (
          <text
            key={label}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={10}
            fill="rgba(255,255,255,0.65)"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Phone mockup ─────────────────────────────────────────────────────────────

function PhoneMockup() {
  const phoneW = 200;
  const phoneH = 360;
  const cornerR = 28;
  const notchW = 60;
  const notchH = 10;

  return (
    <svg width={phoneW} height={phoneH} viewBox={`0 0 ${phoneW} ${phoneH}`}>
      <defs>
        <linearGradient id="phone-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1a3a28" />
          <stop offset="100%" stopColor="#0a2018" />
        </linearGradient>
        <linearGradient id="phone-border" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
        </linearGradient>
        <clipPath id="phone-clip">
          <rect x={3} y={3} width={phoneW - 6} height={phoneH - 6} rx={cornerR - 2} />
        </clipPath>
      </defs>

      {/* Body */}
      <rect x={0} y={0} width={phoneW} height={phoneH} rx={cornerR} fill="url(#phone-border)" />
      <rect x={2} y={2} width={phoneW - 4} height={phoneH - 4} rx={cornerR - 1} fill="url(#phone-bg)" />

      {/* Screen content area */}
      <g clipPath="url(#phone-clip)">
        {/* Status bar */}
        <rect x={2} y={2} width={phoneW - 4} height={22} fill="rgba(0,0,0,0.3)" />
        <text x={phoneW / 2} y={13} textAnchor="middle" dominantBaseline="middle" fontSize={8} fill="rgba(255,255,255,0.5)" fontFamily="system-ui">
          9:41
        </text>

        {/* App header */}
        <rect x={2} y={24} width={phoneW - 4} height={28} fill="rgba(15,74,50,0.9)" />
        <text x={14} y={38} dominantBaseline="middle" fontSize={10} fontWeight="700" fill="white" fontFamily="system-ui">
          Vaardigheidsprofiel
        </text>

        {/* Radar chart area */}
        <rect x={2} y={52} width={phoneW - 4} height={220} fill="rgba(255,255,255,0.04)" />
        <g transform={`translate(${(phoneW - 196) / 2}, 52)`}>
          <FeatureRadarChart size={196} />
        </g>

        {/* Stats row */}
        <rect x={2} y={272} width={phoneW - 4} height={86} fill="rgba(0,0,0,0.15)" />
        {[
          { label: 'Technisch', value: '7.5', color: '#F5A623', x: 14 },
          { label: 'Tactisch', value: '6.8', color: '#60A5FA', x: 64 },
          { label: 'Fysiek', value: '8.2', color: '#4ADE80', x: 114 },
          { label: 'Mentaal', value: '6.0', color: '#C084FC', x: 164 },
        ].map((s) => (
          <g key={s.label}>
            <text x={s.x} y={294} dominantBaseline="middle" fontSize={14} fontWeight="800" fill={s.color} fontFamily="system-ui">
              {s.value}
            </text>
            <text x={s.x} y={310} dominantBaseline="middle" fontSize={7} fill="rgba(255,255,255,0.5)" fontFamily="system-ui">
              {s.label}
            </text>
          </g>
        ))}

        {/* Bottom nav bar */}
        <rect x={2} y={358} width={phoneW - 4} height={phoneH - 358} fill="rgba(15,74,50,0.95)" />
      </g>

      {/* Notch */}
      <rect
        x={(phoneW - notchW) / 2}
        y={0}
        width={notchW}
        height={notchH}
        rx={5}
        fill="#0a2018"
      />

      {/* Highlight sheen */}
      <rect
        x={2}
        y={2}
        width={phoneW - 4}
        height={phoneH - 4}
        rx={cornerR - 1}
        fill="url(#phone-border)"
        opacity={0.4}
      />
    </svg>
  );
}

// ─── Feature Graphic canvas ───────────────────────────────────────────────────

function FeatureGraphicCanvas() {
  return (
    <div
      id="feature-graphic-render"
      style={{
        width: W,
        height: H,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        background: 'linear-gradient(135deg, #1B6B4A 0%, #0F4A32 55%, #092e1f 100%)',
      }}
    >
      {/* ── Decorative geometric shapes ── */}

      {/* Large faint circle, top-left */}
      <div
        style={{
          position: 'absolute',
          top: -120,
          left: -80,
          width: 400,
          height: 400,
          borderRadius: '50%',
          border: '1.5px solid rgba(255,255,255,0.06)',
          pointerEvents: 'none',
        }}
      />
      {/* Medium circle, mid-left */}
      <div
        style={{
          position: 'absolute',
          top: 60,
          left: -40,
          width: 240,
          height: 240,
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.04)',
          pointerEvents: 'none',
        }}
      />

      {/* Hockey stick — inline SVG, bottom-left decorative */}
      <svg
        style={{ position: 'absolute', bottom: 20, left: PAD - 20, opacity: 0.07 }}
        width="120"
        height="160"
        viewBox="0 0 120 160"
      >
        {/* Stick shaft */}
        <rect x="54" y="0" width="12" height="110" rx="6" fill="white" />
        {/* Stick hook */}
        <path d="M54 108 Q54 145 80 150 L100 150 Q110 150 112 140 L112 128 Q112 122 106 122 L80 122 Q66 122 66 108Z" fill="white" />
      </svg>

      {/* Gold accent dot cluster, top-right area */}
      <svg
        style={{ position: 'absolute', top: 30, right: 540, opacity: 0.55 }}
        width="60"
        height="60"
        viewBox="0 0 60 60"
      >
        <circle cx="10" cy="10" r="4" fill="#F5A623" />
        <circle cx="30" cy="6" r="2.5" fill="#F5A623" opacity="0.6" />
        <circle cx="20" cy="28" r="3" fill="#F5A623" opacity="0.4" />
        <circle cx="5" cy="35" r="2" fill="#F5A623" opacity="0.3" />
      </svg>

      {/* Subtle diagonal stripe lines */}
      <svg
        style={{ position: 'absolute', inset: 0, opacity: 0.03 }}
        width={W}
        height={H}
      >
        {Array.from({ length: 12 }, (_, i) => (
          <line
            key={i}
            x1={i * 90 - 100}
            y1={0}
            x2={i * 90 + 300}
            y2={H}
            stroke="white"
            strokeWidth="1"
          />
        ))}
      </svg>

      {/* ── Left: text content ── */}
      <div
        style={{
          position: 'absolute',
          left: PAD,
          top: 0,
          bottom: 0,
          width: 500,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 0,
        }}
      >
        {/* Gold pill badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(245,166,35,0.18)',
            border: '1px solid rgba(245,166,35,0.4)',
            borderRadius: 999,
            padding: '5px 14px',
            marginBottom: 20,
            width: 'fit-content',
          }}
        >
          {/* Tiny hockey ball dot */}
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#F5A623' }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#F5A623', letterSpacing: '0.04em' }}>
            Hockey Development App
          </span>
        </div>

        {/* App name */}
        <div
          style={{
            fontSize: 92,
            fontWeight: 900,
            color: 'white',
            lineHeight: 0.95,
            letterSpacing: '-0.03em',
            marginBottom: 18,
          }}
        >
          Deco
        </div>

        {/* Gold underline accent */}
        <div
          style={{
            width: 64,
            height: 4,
            borderRadius: 2,
            background: '#F5A623',
            marginBottom: 22,
          }}
        />

        {/* Tagline */}
        <div
          style={{
            fontSize: 24,
            fontWeight: 400,
            color: 'rgba(255,255,255,0.80)',
            lineHeight: 1.4,
            letterSpacing: '0.01em',
            maxWidth: 380,
          }}
        >
          Ontwikkel jezelf als hockeyspeler
        </div>

        {/* Sub-tagline / feature bullets */}
        <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            'Vaardigheidsprofiel & radaranalyse',
            'Doelen stellen met AI-feedback',
            'XP, streaks & teamranglijst',
          ].map((text) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#F5A623',
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', fontWeight: 400 }}>
                {text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: phone mockup ── */}
      <div
        style={{
          position: 'absolute',
          right: PAD + 20,
          top: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Glow behind phone */}
        <div
          style={{
            position: 'absolute',
            width: 260,
            height: 320,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(245,166,35,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <PhoneMockup />
      </div>

      {/* ── Bottom-right: small branding ── */}
      <div
        style={{
          position: 'absolute',
          right: PAD,
          bottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          opacity: 0.45,
        }}
      >
        {/* Deco "D" favicon-style mark */}
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: 5,
            background: 'linear-gradient(135deg, #1B6B4A, #0F4A32)',
            border: '1px solid rgba(255,255,255,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 800,
            color: 'white',
          }}
        >
          D
        </div>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.05em' }}>
          decotraining.com
        </span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FeatureGraphicPage() {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    await new Promise((r) => setTimeout(r, 150));

    const el = document.getElementById('feature-graphic-render');
    if (!el) {
      setDownloading(false);
      return;
    }

    try {
      const canvas = await html2canvas(el, {
        width: W,
        height: H,
        scale: 1,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });

      const link = document.createElement('a');
      link.download = `deco-feature-graphic-${W}x${H}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Feature graphic capture failed:', err);
      alert('Download failed — check console for details.');
    }

    setDownloading(false);
  }, []);

  return (
    <div className="space-y-6 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-deco-text">Feature Graphic Generator</h2>
          <p className="text-sm text-deco-text-secondary mt-1">
            Google Play Store feature graphic &mdash; {W}&times;{H}px
          </p>
        </div>
        <a href="/admin/app-store" className="text-xs text-deco-primary hover:underline">
          &larr; Back to App Store Hub
        </a>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-deco-border shadow-sm p-4 flex items-center justify-between">
        <div className="text-sm text-deco-text-secondary">
          Preview rendered at actual size ({W}&times;{H}px). Scroll horizontally if needed.
        </div>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-lg bg-deco-primary text-white hover:bg-deco-primary-dark transition-colors disabled:opacity-50"
        >
          {downloading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating PNG...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download PNG
            </>
          )}
        </button>
      </div>

      {/* Preview — horizontal scroll if viewport is narrower than 1024px */}
      <div className="bg-white rounded-xl border border-deco-border shadow-sm p-6 overflow-x-auto">
        <div style={{ minWidth: W }}>
          <FeatureGraphicCanvas />
        </div>
      </div>

      {/* Spec notes */}
      <div className="bg-white rounded-xl border border-deco-border shadow-sm p-5">
        <h3 className="text-sm font-semibold text-deco-text mb-3">Google Play Store specs</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Dimensions', value: '1024 × 500 px' },
            { label: 'Format', value: 'PNG (no alpha)' },
            { label: 'Max file size', value: '1024 KB' },
            { label: 'Safe zone', value: '80 px from all edges' },
          ].map((item) => (
            <div key={item.label} className="rounded-lg bg-gray-50 px-4 py-3">
              <div className="text-xs text-deco-text-secondary">{item.label}</div>
              <div className="text-sm font-semibold text-deco-text mt-0.5">{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
