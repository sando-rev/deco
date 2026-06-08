'use client';

import { useState, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas-pro';

// ─── Store size presets ─────────────────────────────────────────────────────

const SIZE_PRESETS = [
  // ── Apple App Store ──────────────────────────────────────────────────────
  // iPhone 16 Pro Max (6.9") — newest required size as of 2025
  { key: 'iphone69', label: '6.9" iPhone 16 Pro Max', w: 1320, h: 2868, store: 'App Store', required: true },
  // iPhone 15 Pro Max / 14 Pro Max (6.7")
  { key: 'iphone67', label: '6.7" iPhone 15 Pro Max', w: 1290, h: 2796, store: 'App Store', required: true },
  // iPhone 11 Pro Max / XS Max (6.5")
  { key: 'iphone65', label: '6.5" iPhone 11 Pro Max', w: 1284, h: 2778, store: 'App Store', required: false },
  // iPhone 8 Plus (5.5")
  { key: 'iphone55', label: '5.5" iPhone 8 Plus', w: 1242, h: 2208, store: 'App Store', required: false },
  // iPad Pro 12.9" (3rd gen+) — required if supporting iPad
  { key: 'ipad129', label: '12.9" iPad Pro', w: 2048, h: 2732, store: 'App Store', required: false },
  // iPad Pro 12.9" (2nd gen) — older required size
  { key: 'ipad129v2', label: '12.9" iPad Pro (2nd gen)', w: 2732, h: 2048, store: 'App Store', required: false },
  // iPad 13" (M-series) — required for iPad apps
  { key: 'ipad13', label: '13" iPad (M-series)', w: 2064, h: 2752, store: 'App Store', required: true },
  // MacBook Pro 16" — required for "Designed for iPad" on Mac
  { key: 'mac16', label: '16" MacBook Pro', w: 3456, h: 2234, store: 'App Store', required: true },
  // ── Google Play ──────────────────────────────────────────────────────────
  { key: 'android', label: 'Android Phone', w: 1080, h: 1920, store: 'Google Play', required: true },
  { key: 'android_tall', label: 'Android Tall', w: 1080, h: 2400, store: 'Google Play', required: false },
] as const;

// Base render size — we render at this width and scale up via html2canvas
const BASE_W = 390;

// For iPad landscape sizes (w > h) we constrain preview height instead of width
const PREVIEW_LONG_SIDE = 220;

// ─── Screen definitions ─────────────────────────────────────────────────────

const SCREENS = [
  { key: 'profile', label: 'Vaardigheidsprofiel', group: 'athlete' },
  { key: 'goals', label: 'Doelen & AI-feedback', group: 'athlete' },
  { key: 'development', label: 'Ontwikkeling & XP', group: 'athlete' },
  { key: 'reflection', label: 'Sessiereflectie', group: 'athlete' },
  { key: 'team', label: 'Teamoverzicht', group: 'coach' },
  { key: 'player', label: 'Spelersprofiel', group: 'coach' },
] as const;

// ─── Radar chart (simple SVG, no external dependency) ───────────────────────

function SimpleRadarChart({ size = 160 }: { size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.4;
  const attrs = ['Technisch', 'Tactisch', 'Fysiek', 'Mentaal', 'Passen', 'Dribbel', 'Visie', 'Leider'];
  const values = [7.5, 6.8, 8.2, 6.0, 7.0, 6.5, 5.5, 7.2];
  const n = attrs.length;

  const getPoint = (i: number, val: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const dist = (val / 10) * r;
    return [cx + dist * Math.cos(angle), cy + dist * Math.sin(angle)];
  };

  const gridLevels = [0.25, 0.5, 0.75, 1];
  const dataPoints = values.map((v, i) => getPoint(i, v));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ') + 'Z';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid */}
      {gridLevels.map((level) => {
        const pts = Array.from({ length: n }, (_, i) => getPoint(i, level * 10));
        return <polygon key={level} points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke="#E5E7EB" strokeWidth={1} />;
      })}
      {/* Axes */}
      {Array.from({ length: n }, (_, i) => {
        const [x, y] = getPoint(i, 10);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#E5E7EB" strokeWidth={0.5} />;
      })}
      {/* Data */}
      <polygon points={dataPoints.map((p) => p.join(',')).join(' ')} fill="rgba(27,107,74,0.15)" stroke="#1B6B4A" strokeWidth={2} />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={3} fill="#1B6B4A" />
      ))}
      {/* Labels */}
      {attrs.map((label, i) => {
        const [x, y] = getPoint(i, 11.8);
        return (
          <text key={label} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize={8} fill="#6B7280" fontFamily="system-ui">
            {label}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Screen components (all px-based, designed for ~390px width) ────────────

function ProfileScreen() {
  return (
    <div style={{ width: '100%', height: '100%', background: '#F8FAF9', display: 'flex', flexDirection: 'column', paddingTop: 52, paddingLeft: 20, paddingRight: 20, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#1A1A2E', marginBottom: 2 }}>Welkom terug, Sarah</div>
      <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>Jouw vaardigheidsprofiel</div>
      <div style={{ background: 'white', borderRadius: 16, padding: 12, marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
        <SimpleRadarChart size={180} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        {[
          { l: 'Technisch', v: '7.5', color: '#1B6B4A', icon: '⚡' },
          { l: 'Tactisch', v: '6.8', color: '#2563EB', icon: '🧠' },
          { l: 'Fysiek', v: '8.2', color: '#D97706', icon: '💪' },
          { l: 'Mentaal', v: '6.0', color: '#7C3AED', icon: '🎯' },
        ].map((s) => (
          <div key={s.l} style={{ background: 'white', borderRadius: 12, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.v}</div>
              <div style={{ fontSize: 11, color: '#6B7280' }}>{s.l}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#1B6B4A', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Technisch</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {['Aannemen', 'Push pass', 'Dribble'].map((s) => (
          <div key={s} style={{ flex: 1, background: 'white', borderRadius: 10, padding: '6px 4px', textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#1A1A2E' }}>7</div>
            <div style={{ fontSize: 9, color: '#6B7280' }}>{s}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Tactisch</div>
      <div style={{ display: 'flex', gap: 6 }}>
        {['Positiespel', 'Loopacties', 'Overzicht'].map((s) => (
          <div key={s} style={{ flex: 1, background: 'white', borderRadius: 10, padding: '6px 4px', textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#1A1A2E' }}>6</div>
            <div style={{ fontSize: 9, color: '#6B7280' }}>{s}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GoalsScreen() {
  const goals = [
    { title: 'Verbeter backhand push', attr: 'Technisch', progress: 70, target: 8, feedback: true },
    { title: 'Bouw sprintconditie op', attr: 'Fysiek', progress: 45, target: 7, feedback: false },
    { title: 'Coachen vanuit verdediging', attr: 'Tactisch', progress: 30, target: 9, feedback: true },
  ];
  return (
    <div style={{ width: '100%', height: '100%', background: '#F8FAF9', display: 'flex', flexDirection: 'column', paddingTop: 52, paddingLeft: 20, paddingRight: 20, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#1A1A2E', marginBottom: 12 }}>Jouw doelen</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <div style={{ background: '#1B6B4A', color: 'white', fontSize: 12, fontWeight: 600, padding: '6px 16px', borderRadius: 999 }}>Actief (3)</div>
        <div style={{ background: '#F3F4F6', color: '#6B7280', fontSize: 12, fontWeight: 600, padding: '6px 16px', borderRadius: 999 }}>Behaald</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {goals.map((g) => (
          <div key={g.title} style={{ background: 'white', borderRadius: 16, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A2E', maxWidth: '65%' }}>{g.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {g.feedback && <span style={{ fontSize: 14 }}>👍</span>}
                <div style={{ fontSize: 10, background: 'rgba(27,107,74,0.1)', color: '#1B6B4A', padding: '3px 10px', borderRadius: 999, fontWeight: 600 }}>{g.attr}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, height: 6, background: '#F3F4F6', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: `${g.progress}%`, height: '100%', background: '#1B6B4A', borderRadius: 999 }} />
              </div>
              <div style={{ fontSize: 10, color: '#6B7280', fontWeight: 600 }}>Doel: {g.target}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16, background: 'rgba(245,166,35,0.1)', borderRadius: 16, padding: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#F5A623', marginBottom: 4 }}>AI Feedback</div>
        <div style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.6 }}>
          Goed doel! Maak het meetbaarder: hoeveel geslaagde backhand pushes wil je per training? Probeer 3x per week de wandpasoefening.
        </div>
      </div>
    </div>
  );
}

function DevelopmentScreen() {
  return (
    <div style={{ width: '100%', height: '100%', background: '#F8FAF9', display: 'flex', flexDirection: 'column', paddingTop: 52, paddingLeft: 20, paddingRight: 20, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#1A1A2E', marginBottom: 12 }}>Ontwikkeling</div>
      <div style={{ background: '#0F4A32', borderRadius: 16, padding: 16, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>Totaal XP</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: 'white' }}>340</div>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20 }}>🔥</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'white' }}>5</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)' }}>Streak</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20 }}>🏆</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'white' }}>3</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)' }}>Behaald</div>
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <div style={{ background: 'white', borderRadius: 14, padding: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1B6B4A' }}>12</div>
          <div style={{ fontSize: 10, color: '#6B7280' }}>Reflecties</div>
        </div>
        <div style={{ background: 'white', borderRadius: 14, padding: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#22C55E' }}>4</div>
          <div style={{ fontSize: 10, color: '#6B7280' }}>Beoordelingen</div>
        </div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#1A1A2E', marginBottom: 8 }}>Komende sessies</div>
      {[
        { type: 'Training', time: 'Di 11 mrt · 19:00', icon: '🏑', hasFocus: true },
        { type: 'Wedstrijd', time: 'Za 15 mrt · 14:30', icon: '🏆', hasFocus: false },
      ].map((s) => (
        <div key={s.time} style={{ background: 'white', borderRadius: 14, padding: 12, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: 'rgba(27,107,74,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{s.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E' }}>{s.type}</div>
            <div style={{ fontSize: 10, color: '#6B7280' }}>{s.time}</div>
          </div>
          {s.hasFocus && (
            <div style={{ background: 'rgba(27,107,74,0.1)', padding: '4px 10px', borderRadius: 999, fontSize: 10, fontWeight: 600, color: '#1B6B4A' }}>Focus</div>
          )}
        </div>
      ))}
      <div style={{ fontSize: 12, fontWeight: 700, color: '#1A1A2E', marginBottom: 6, marginTop: 4 }}>Teamranglijst</div>
      <div style={{ background: 'white', borderRadius: 14, overflow: 'hidden' }}>
        {[
          { name: 'Sarah van Dijk', xp: 340, medal: '🥇' },
          { name: 'Emma Bakker', xp: 275, medal: '🥈' },
          { name: 'Lisa de Vries', xp: 210, medal: '🥉' },
        ].map((p, i) => (
          <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: i === 0 ? 'rgba(27,107,74,0.05)' : 'transparent' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14 }}>{p.medal}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#1A1A2E' }}>{p.name}</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#1B6B4A' }}>{p.xp} XP</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReflectionScreen() {
  return (
    <div style={{ width: '100%', height: '100%', background: '#F8FAF9', display: 'flex', flexDirection: 'column', paddingTop: 52, paddingLeft: 20, paddingRight: 20, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#1A1A2E', marginBottom: 2 }}>Reflectie</div>
      <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 16 }}>Training · Di 11 mrt</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E', marginBottom: 8 }}>Focus doelen deze sessie</div>
      {[
        { title: 'Verbeter backhand push', score: 7 },
        { title: 'Bouw sprintconditie op', score: 6 },
      ].map((g) => (
        <div key={g.title} style={{ background: 'white', borderRadius: 16, padding: 14, marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E', marginBottom: 8 }}>{g.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ fontSize: 10, color: '#6B7280' }}>Score:</div>
            <div style={{ display: 'flex', gap: 3 }}>
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} style={{ width: 12, height: 12, borderRadius: 3, background: i < g.score ? '#1B6B4A' : '#E5E7EB' }} />
              ))}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1B6B4A' }}>{g.score}</div>
          </div>
        </div>
      ))}
      <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E', marginBottom: 8, marginTop: 4 }}>Wat heb je geleerd?</div>
      <div style={{ background: 'white', borderRadius: 16, padding: 14, marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.7 }}>
          Backhand push ging goed bij de passoefening, maar onder druk in het partijspel viel ik terug op forehand. Volgende keer bewust kiezen voor backhand in 1v1 situaties.
        </div>
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E', marginBottom: 8 }}>Stemming</div>
      <div style={{ display: 'flex', gap: 10 }}>
        {[
          { emoji: '😊', label: 'Goed', active: true },
          { emoji: '😐', label: 'Oké', active: false },
          { emoji: '😔', label: 'Matig', active: false },
        ].map((m) => (
          <div key={m.label} style={{ flex: 1, borderRadius: 14, padding: 10, textAlign: 'center', background: m.active ? 'rgba(27,107,74,0.1)' : 'white', border: m.active ? '2px solid rgba(27,107,74,0.3)' : '2px solid transparent' }}>
            <div style={{ fontSize: 24 }}>{m.emoji}</div>
            <div style={{ fontSize: 10, color: '#6B7280', marginTop: 4 }}>{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamScreen() {
  const players = [
    { name: 'Sarah van Dijk', goals: 3, lastActive: 'Vandaag', active: true },
    { name: 'Emma Bakker', goals: 2, lastActive: 'Gisteren', active: true },
    { name: 'Lisa de Vries', goals: 2, lastActive: '3 dagen', active: false },
    { name: 'Sophie Jansen', goals: 1, lastActive: 'Vandaag', active: true },
  ];
  return (
    <div style={{ width: '100%', height: '100%', background: '#F8FAF9', display: 'flex', flexDirection: 'column', paddingTop: 52, paddingLeft: 20, paddingRight: 20, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#1A1A2E' }}>HC Amsterdam L1</div>
      <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 12 }}>4 spelers</div>
      <div style={{ background: 'white', borderRadius: 16, padding: 16, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 10, color: '#6B7280' }}>Uitnodigingscode</div>
          <div style={{ fontSize: 20, fontFamily: 'monospace', fontWeight: 800, color: '#1B6B4A', letterSpacing: '0.15em' }}>AMS24X</div>
        </div>
        <div style={{ background: 'rgba(27,107,74,0.1)', color: '#1B6B4A', fontSize: 11, fontWeight: 600, padding: '6px 14px', borderRadius: 999 }}>Delen</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {players.map((p) => (
          <div key={p.name} style={{ background: 'white', borderRadius: 16, padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, background: 'rgba(27,107,74,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#1B6B4A' }}>{p.name.split(' ').map((n) => n[0]).join('')}</span>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E' }}>{p.name}</div>
                <div style={{ fontSize: 10, color: '#6B7280' }}>{p.goals} doelen · {p.lastActive}</div>
              </div>
            </div>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.active ? '#4ADE80' : '#D1D5DB' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function PlayerScreen() {
  return (
    <div style={{ width: '100%', height: '100%', background: '#F8FAF9', display: 'flex', flexDirection: 'column', paddingTop: 52, paddingLeft: 20, paddingRight: 20, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ width: 40, height: 40, background: 'rgba(27,107,74,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#1B6B4A' }}>SV</span>
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#1A1A2E' }}>Sarah van Dijk</div>
          <div style={{ fontSize: 10, color: '#6B7280' }}>Veldspeler · Laatst actief: Vandaag</div>
        </div>
      </div>
      <div style={{ background: 'white', borderRadius: 16, padding: 12, marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
        <SimpleRadarChart size={160} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        {[
          { l: 'Technisch', v: '7.5', color: '#1B6B4A' },
          { l: 'Tactisch', v: '6.8', color: '#2563EB' },
          { l: 'Fysiek', v: '8.2', color: '#D97706' },
          { l: 'Mentaal', v: '6.0', color: '#7C3AED' },
        ].map((s) => (
          <div key={s.l} style={{ background: 'white', borderRadius: 10, padding: '6px 10px' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: s.color }}>{s.v}</div>
            <div style={{ fontSize: 9, color: '#6B7280' }}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E', marginBottom: 8 }}>Actieve doelen</div>
      {[
        { title: 'Verbeter backhand push', attr: 'Technisch' },
        { title: 'Bouw sprintconditie op', attr: 'Fysiek' },
      ].map((g) => (
        <div key={g.title} style={{ background: 'white', borderRadius: 14, padding: 12, marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#1A1A2E' }}>{g.title}</div>
            <div style={{ fontSize: 9, color: '#6B7280' }}>{g.attr}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ fontSize: 14 }}>👍</span>
            <span style={{ fontSize: 14 }}>💬</span>
          </div>
        </div>
      ))}
    </div>
  );
}

const SCREEN_COMPONENTS: Record<string, React.ReactNode> = {
  profile: <ProfileScreen />,
  goals: <GoalsScreen />,
  development: <DevelopmentScreen />,
  reflection: <ReflectionScreen />,
  team: <TeamScreen />,
  player: <PlayerScreen />,
};

// ─── Page ───────────────────────────────────────────────────────────────────

export default function ScreenshotGeneratorPage() {
  const [generating, setGenerating] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<(typeof SIZE_PRESETS)[number]>(SIZE_PRESETS[0]);
  const offscreenRef = useRef<HTMLDivElement>(null);

  // Landscape sizes (iPad 2nd gen stored as w > h) need separate handling
  const isLandscape = selectedSize.w > selectedSize.h;
  // For portrait: render at BASE_W wide. For landscape (iPad rotated): render at BASE_W tall.
  const baseH = isLandscape
    ? BASE_W
    : Math.round(BASE_W * (selectedSize.h / selectedSize.w));
  const scale = isLandscape
    ? selectedSize.h / BASE_W
    : selectedSize.w / BASE_W;

  // Preview dimensions — always constrain the long side to PREVIEW_LONG_SIDE
  const previewW = isLandscape
    ? PREVIEW_LONG_SIDE
    : Math.round(PREVIEW_LONG_SIDE * (selectedSize.w / selectedSize.h));
  const previewH = isLandscape
    ? Math.round(PREVIEW_LONG_SIDE * (selectedSize.h / selectedSize.w))
    : PREVIEW_LONG_SIDE;
  const previewScale = previewW / BASE_W;

  const captureScreenshot = useCallback(
    async (screenKey: string) => {
      setGenerating(screenKey);
      await new Promise((r) => setTimeout(r, 200));

      const el = document.getElementById(`render-${screenKey}`);
      if (!el) {
        setGenerating(null);
        return;
      }

      try {
        const canvas = await html2canvas(el, {
          width: BASE_W,
          height: baseH,
          scale,
          useCORS: true,
          backgroundColor: '#F8FAF9',
        });

        const link = document.createElement('a');
        link.download = `deco-${screenKey}-${selectedSize.w}x${selectedSize.h}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (err) {
        console.error('Screenshot capture failed:', err);
        alert('Screenshot capture failed — check console for details.');
      }

      setGenerating(null);
    },
    [baseH, scale, selectedSize]
  );

  const downloadAll = useCallback(async () => {
    for (const screen of SCREENS) {
      await captureScreenshot(screen.key);
      await new Promise((r) => setTimeout(r, 600));
    }
  }, [captureScreenshot]);

  // Group size presets by store for cleaner UI
  const appStorePresets = SIZE_PRESETS.filter((s) => s.store === 'App Store');
  const playStorePresets = SIZE_PRESETS.filter((s) => s.store === 'Google Play');

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-deco-text">Screenshot Generator</h2>
          <p className="text-sm text-deco-text-secondary mt-1">
            Generate store-ready screenshots at exact pixel sizes
          </p>
        </div>
        <a href="/admin/app-store" className="text-xs text-deco-primary hover:underline">
          &larr; Back to App Store Hub
        </a>
      </div>

      {/* Size selector */}
      <section className="bg-white rounded-xl border border-deco-border shadow-sm p-6">
        <p className="text-sm font-semibold text-deco-text mb-3">Select output size</p>

        {/* Apple App Store group */}
        <div className="mb-4">
          <p className="text-[11px] font-semibold text-deco-text-secondary uppercase tracking-wider mb-2">Apple App Store</p>
          <div className="flex flex-wrap gap-2">
            {appStorePresets.map((size) => (
              <button
                key={size.key}
                onClick={() => setSelectedSize(size)}
                className={`text-xs px-3 py-2 rounded-lg border transition-colors ${
                  selectedSize.key === size.key
                    ? 'bg-deco-primary text-white border-deco-primary'
                    : 'bg-white text-deco-text border-deco-border hover:border-deco-primary/50'
                }`}
              >
                {size.label}
                {size.required && <span className="ml-1 text-[9px] font-bold opacity-80">REQ</span>}
                <span className="block text-[10px] opacity-70 font-mono">{size.w}&times;{size.h}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Google Play group */}
        <div className="mb-4">
          <p className="text-[11px] font-semibold text-deco-text-secondary uppercase tracking-wider mb-2">Google Play Store</p>
          <div className="flex flex-wrap gap-2">
            {playStorePresets.map((size) => (
              <button
                key={size.key}
                onClick={() => setSelectedSize(size)}
                className={`text-xs px-3 py-2 rounded-lg border transition-colors ${
                  selectedSize.key === size.key
                    ? 'bg-deco-primary text-white border-deco-primary'
                    : 'bg-white text-deco-text border-deco-border hover:border-deco-primary/50'
                }`}
              >
                {size.label}
                {size.required && <span className="ml-1 text-[9px] font-bold opacity-80">REQ</span>}
                <span className="block text-[10px] opacity-70 font-mono">{size.w}&times;{size.h}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={downloadAll}
            disabled={generating !== null}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg bg-deco-primary text-white hover:bg-deco-primary-dark transition-colors disabled:opacity-50"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download All ({selectedSize.w}&times;{selectedSize.h})
          </button>
          <span className="text-[10px] text-deco-text-secondary">* = required for store submission</span>
        </div>
      </section>

      {/* Screenshot grid */}
      <section className="bg-white rounded-xl border border-deco-border shadow-sm p-6">
        {isLandscape && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
            Landscape format selected. The phone screen content will be rendered portrait-style and scaled to fit — for iPad submissions, replace screen content with iPad-optimised layouts.
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SCREENS.map((screen) => (
            <div key={screen.key} className="flex flex-col items-center">
              {/* Visible preview (scaled down) */}
              <div
                className="border border-deco-border rounded-xl overflow-hidden bg-[#F8FAF9] relative"
                style={{ width: previewW, height: previewH }}
              >
                <div
                  style={{
                    width: BASE_W,
                    height: baseH,
                    transform: `scale(${previewScale})`,
                    transformOrigin: 'top left',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                  }}
                >
                  {SCREEN_COMPONENTS[screen.key]}
                </div>
              </div>
              <p className="text-sm font-medium text-deco-text mt-2">{screen.label}</p>
              <p className="text-[10px] text-deco-text-secondary capitalize mb-2">
                {screen.group} &middot; {selectedSize.w}&times;{selectedSize.h}
              </p>
              <button
                onClick={() => captureScreenshot(screen.key)}
                disabled={generating !== null}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-deco-border hover:bg-gray-50 text-deco-text transition-colors disabled:opacity-50"
              >
                {generating === screen.key ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generating...
                  </span>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download PNG
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Offscreen render targets for html2canvas (hidden but in DOM) */}
      <div
        ref={offscreenRef}
        style={{ position: 'fixed', left: '-9999px', top: 0, pointerEvents: 'none' }}
        aria-hidden="true"
      >
        {SCREENS.map((screen) => (
          <div
            key={screen.key}
            id={`render-${screen.key}`}
            style={{ width: BASE_W, height: baseH, overflow: 'hidden' }}
          >
            {SCREEN_COMPONENTS[screen.key]}
          </div>
        ))}
      </div>
    </div>
  );
}
