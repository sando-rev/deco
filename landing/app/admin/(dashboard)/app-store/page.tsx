'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import LoadingState from '@/components/admin/LoadingState';
import { RadarChartWeb } from '@/components/RadarChartWeb';

// ─── Types ──────────────────────────────────────────────────────────────────

interface BuildAsset {
  name: string;
  size: number;
  downloadUrl: string;
  downloads: number;
}

interface Build {
  version: string;
  name: string;
  body: string;
  publishedAt: string;
  url: string;
  prerelease: boolean;
  apk: BuildAsset | null;
  aab: BuildAsset | null;
}

// ─── Store Metadata ─────────────────────────────────────────────────────────

const STORE_META = {
  appName: 'Deco',
  subtitle: 'Hockey Ontwikkelcoaching',
  bundleId: {
    android: 'com.decotraining.app',
    ios: 'com.decotraining.app',
  },
  category: 'Sports',
  // Apple App Store Connect primary/secondary category
  iosCategory: { primary: 'Sports', secondary: 'Education' },
  privacyUrl: 'https://decotraining.com/privacy',
  website: 'https://decotraining.com',
  supportUrl: 'https://decotraining.com',
  supportEmail: 'hockeymentaal@gmail.com',
  marketingUrl: 'https://decotraining.com',
  defaultLanguage: 'nl-NL',
  contentRating: 'Everyone',
  // Apple age rating: 4+ (no objectionable content)
  iosAgeRating: '4+',
  copyright: `${new Date().getFullYear()} Sando van der Helm`,
  shortDescription:
    'Stel doelen, reflecteer na elke sessie en groei als hockeyspeler.',
  fullDescription: `Deco is de app voor hockeyers die het beste uit zichzelf willen halen. Stel persoonlijke ontwikkelingsdoelen, reflecteer na trainingen en wedstrijden, en volg je groei — samen met je coach.

Belangrijkste functies:
• Persoonlijke doelen stellen en bijhouden
• Reflecteren na trainingen en wedstrijden
• AI-feedback op je doelen
• Coach-speler samenwerking
• XP, achievements en leaderboard
• Trainingsschema met herinneringen
• Skill-scan en ontwikkeloverzicht

Voor spelers én coaches — van jeugd tot senioren.`,
  keywords:
    'hockey, training, coaching, doelen, reflectie, ontwikkeling, sport, hockeymentaal, veldhockey',
  whatsNew: `v2.0.0 — Sessiedoelen, Notificaties & Skill-scan
• Sessiedoelen: kies focuspunten per training of wedstrijd
• Pre-training meldingen: 1 uur voor je training
• Post-training meldingen: reflecteer direct na je sessie
• Uitgebreide skill-scan met coachbeoordelingen
• Account verwijderen (GDPR-compliant)`,
  // Apple App Store Connect — Review Information
  reviewNotes: `Demo account for review:
Email: reviewer@decotraining.com
Password: ReviewDeco2026!

The app requires an invite code to join a team. Use code: DEMO24 to join the demo team as a player, or log in with the coach account (coach@decotraining.com / CoachDemo2026!) to see the coach side.`,
};

// ─── Screenshot size specs ──────────────────────────────────────────────────

const SCREENSHOT_SPECS = {
  iphone67: { w: 1290, h: 2796, label: '6.7" iPhone (required)', ratio: '9:19.5' },
  iphone65: { w: 1284, h: 2778, label: '6.5" iPhone', ratio: '9:19.5' },
  iphone55: { w: 1242, h: 2208, label: '5.5" iPhone', ratio: '9:16' },
  ipad129: { w: 2048, h: 2732, label: '12.9" iPad', ratio: '3:4' },
  android: { w: 1080, h: 1920, label: 'Android Phone', ratio: '9:16' },
  android7: { w: 1080, h: 2400, label: 'Android 7" (tall)', ratio: '9:20' },
};

// ─── Screenshot Screen Components ───────────────────────────────────────────

function ProfileScreen() {
  return (
    <div className="w-full h-full bg-[#F8FAF9] flex flex-col pt-10 px-3">
      <div className="text-[11px] font-extrabold text-[#1A1A2E] mb-0.5">Welkom terug, Sarah</div>
      <div className="text-[8px] text-[#6B7280] mb-2">Jouw vaardigheidsprofiel</div>
      <div className="bg-white rounded-xl p-2 mb-2 flex justify-center">
        <RadarChartWeb size={130} />
      </div>
      {/* Category scores */}
      <div className="grid grid-cols-2 gap-1.5 mb-2">
        {[
          { l: 'Technisch', v: '7.5', color: '#1B6B4A', icon: '⚡' },
          { l: 'Tactisch', v: '6.8', color: '#2563EB', icon: '🧠' },
          { l: 'Fysiek', v: '8.2', color: '#D97706', icon: '💪' },
          { l: 'Mentaal', v: '6.0', color: '#7C3AED', icon: '🎯' },
        ].map((s) => (
          <div key={s.l} className="bg-white rounded-lg py-1.5 px-2 flex items-center gap-1.5">
            <span className="text-[10px]">{s.icon}</span>
            <div>
              <div className="text-[10px] font-extrabold" style={{ color: s.color }}>{s.v}</div>
              <div className="text-[6px] text-[#6B7280]">{s.l}</div>
            </div>
          </div>
        ))}
      </div>
      {/* Individual skills */}
      <div className="text-[7px] font-bold text-[#1B6B4A] uppercase tracking-wider mb-1">Technisch</div>
      <div className="flex gap-1 mb-1.5">
        {['Aannemen', 'Push pass', 'Dribble'].map((s) => (
          <div key={s} className="bg-white rounded-md px-1.5 py-1 text-center flex-1">
            <div className="text-[9px] font-bold text-[#1A1A2E]">7</div>
            <div className="text-[5px] text-[#6B7280]">{s}</div>
          </div>
        ))}
      </div>
      <div className="text-[7px] font-bold text-[#2563EB] uppercase tracking-wider mb-1">Tactisch</div>
      <div className="flex gap-1">
        {['Positiespel', 'Loopacties', 'Overzicht'].map((s) => (
          <div key={s} className="bg-white rounded-md px-1.5 py-1 text-center flex-1">
            <div className="text-[9px] font-bold text-[#1A1A2E]">6</div>
            <div className="text-[5px] text-[#6B7280]">{s}</div>
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
    <div className="w-full h-full bg-[#F8FAF9] flex flex-col pt-10 px-3">
      <div className="text-[11px] font-extrabold text-[#1A1A2E] mb-2">Jouw doelen</div>
      <div className="flex gap-2 mb-3">
        <div className="bg-[#1B6B4A] text-white text-[8px] font-semibold px-2.5 py-1 rounded-full">Actief (3)</div>
        <div className="bg-gray-100 text-[#6B7280] text-[8px] font-semibold px-2.5 py-1 rounded-full">Behaald</div>
      </div>
      <div className="flex flex-col gap-2">
        {goals.map((g) => (
          <div key={g.title} className="bg-white rounded-xl p-2.5">
            <div className="flex items-center justify-between mb-1">
              <div className="text-[9px] font-bold text-[#1A1A2E] leading-tight max-w-[65%]">{g.title}</div>
              <div className="flex items-center gap-1">
                {g.feedback && (
                  <div className="w-4 h-4 bg-[#1B6B4A]/10 rounded-full flex items-center justify-center">
                    <span className="text-[8px]">{'\u{1F44D}'}</span>
                  </div>
                )}
                <div className="text-[7px] bg-[#1B6B4A]/10 text-[#1B6B4A] px-1.5 py-0.5 rounded-full font-semibold">{g.attr}</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#1B6B4A] rounded-full" style={{ width: `${g.progress}%` }} />
              </div>
              <div className="text-[7px] text-[#6B7280] font-semibold">Doel: {g.target}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 bg-[#F5A623]/10 rounded-xl p-2.5">
        <div className="text-[8px] font-bold text-[#F5A623] mb-0.5">AI Feedback</div>
        <div className="text-[7px] text-[#6B7280] leading-relaxed">
          Goed doel! Maak het meetbaarder: hoeveel geslaagde backhand pushes wil je per training? Probeer 3x per week de wandpasoefening.
        </div>
      </div>
    </div>
  );
}

function DevelopmentScreen() {
  return (
    <div className="w-full h-full bg-[#F8FAF9] flex flex-col pt-10 px-3">
      <div className="text-[11px] font-extrabold text-[#1A1A2E] mb-2">Ontwikkeling</div>
      {/* XP Hero */}
      <div className="bg-[#0F4A32] rounded-xl p-3 mb-2 flex items-center justify-between">
        <div>
          <div className="text-[7px] text-white/70">Totaal XP</div>
          <div className="text-[18px] font-extrabold text-white">340</div>
          <div className="text-[7px] text-white/60 font-semibold">XP</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-center">
            <div className="text-[14px]">{'\u{1F525}'}</div>
            <div className="text-[10px] font-bold text-white">5</div>
            <div className="text-[6px] text-white/70">Streak</div>
          </div>
          <div className="text-center">
            <div className="text-[14px]">{'\u{1F3C6}'}</div>
            <div className="text-[10px] font-bold text-white">3</div>
            <div className="text-[6px] text-white/70">Behaald</div>
          </div>
        </div>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-2 gap-1.5 mb-2">
        <div className="bg-white rounded-xl p-2 text-center">
          <div className="text-[14px] font-extrabold text-[#1B6B4A]">12</div>
          <div className="text-[7px] text-[#6B7280]">Reflecties</div>
        </div>
        <div className="bg-white rounded-xl p-2 text-center">
          <div className="text-[14px] font-extrabold text-[#22C55E]">4</div>
          <div className="text-[7px] text-[#6B7280]">Beoordelingen</div>
        </div>
      </div>
      {/* Upcoming */}
      <div className="text-[8px] font-bold text-[#1A1A2E] mb-1">Komende sessies</div>
      {[
        { type: 'Training', time: 'Di 11 mrt · 19:00', icon: '🏑', hasFocus: true },
        { type: 'Wedstrijd', time: 'Za 15 mrt · 14:30', icon: '🏆', hasFocus: false },
      ].map((s) => (
        <div key={s.time} className="bg-white rounded-xl p-2 mb-1 flex items-center gap-2">
          <div className="w-7 h-7 bg-[#1B6B4A]/10 rounded-full flex items-center justify-center text-[12px]">{s.icon}</div>
          <div className="flex-1">
            <div className="text-[8px] font-semibold text-[#1A1A2E]">{s.type}</div>
            <div className="text-[6px] text-[#6B7280]">{s.time}</div>
          </div>
          {s.hasFocus && (
            <div className="bg-[#1B6B4A]/10 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <span className="text-[8px]">{'\u{1F3F3}'}</span>
              <span className="text-[6px] font-semibold text-[#1B6B4A]">Focus</span>
            </div>
          )}
        </div>
      ))}
      {/* Leaderboard */}
      <div className="text-[8px] font-bold text-[#1A1A2E] mb-1 mt-1">Teamranglijst</div>
      <div className="bg-white rounded-xl overflow-hidden">
        {[
          { rank: 1, name: 'Sarah van Dijk', xp: 340, medal: '\u{1F947}' },
          { rank: 2, name: 'Emma Bakker', xp: 275, medal: '\u{1F948}' },
          { rank: 3, name: 'Lisa de Vries', xp: 210, medal: '\u{1F949}' },
        ].map((p) => (
          <div key={p.name} className={`flex items-center justify-between px-2.5 py-1.5 ${p.rank === 1 ? 'bg-[#1B6B4A]/5' : ''}`}>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px]">{p.medal}</span>
              <div className="text-[8px] font-semibold text-[#1A1A2E]">{p.name}</div>
            </div>
            <div className="text-[8px] font-bold text-[#1B6B4A]">{p.xp} XP</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CoachTeamScreen() {
  const players = [
    { name: 'Sarah van Dijk', goals: 3, lastActive: 'Vandaag', active: true },
    { name: 'Emma Bakker', goals: 2, lastActive: 'Gisteren', active: true },
    { name: 'Lisa de Vries', goals: 2, lastActive: '3 dagen', active: false },
    { name: 'Sophie Jansen', goals: 1, lastActive: 'Vandaag', active: true },
  ];
  return (
    <div className="w-full h-full bg-[#F8FAF9] flex flex-col pt-10 px-3">
      <div className="text-[11px] font-extrabold text-[#1A1A2E]">HC Amsterdam L1</div>
      <div className="text-[8px] text-[#6B7280] mb-2">4 spelers</div>
      <div className="bg-white rounded-xl p-2.5 mb-3 flex items-center justify-between">
        <div>
          <div className="text-[7px] text-[#6B7280]">Uitnodigingscode</div>
          <div className="text-[11px] font-mono font-extrabold text-[#1B6B4A] tracking-widest">AMS24X</div>
        </div>
        <div className="bg-[#1B6B4A]/10 text-[#1B6B4A] text-[7px] font-semibold px-2 py-1 rounded-full">Delen</div>
      </div>
      <div className="flex flex-col gap-1.5">
        {players.map((p) => (
          <div key={p.name} className="bg-white rounded-xl p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#1B6B4A]/10 rounded-full flex items-center justify-center">
                <span className="text-[9px] font-bold text-[#1B6B4A]">{p.name.split(' ').map((n) => n[0]).join('')}</span>
              </div>
              <div>
                <div className="text-[9px] font-semibold text-[#1A1A2E]">{p.name}</div>
                <div className="text-[6px] text-[#6B7280]">{p.goals} doelen · {p.lastActive}</div>
              </div>
            </div>
            <div className={`w-2 h-2 rounded-full ${p.active ? 'bg-green-400' : 'bg-gray-300'}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

function CoachPlayerScreen() {
  return (
    <div className="w-full h-full bg-[#F8FAF9] flex flex-col pt-10 px-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 bg-[#1B6B4A]/10 rounded-full flex items-center justify-center">
          <span className="text-[10px] font-bold text-[#1B6B4A]">SV</span>
        </div>
        <div>
          <div className="text-[10px] font-extrabold text-[#1A1A2E]">Sarah van Dijk</div>
          <div className="text-[7px] text-[#6B7280]">Veldspeler · Laatst actief: Vandaag</div>
        </div>
      </div>
      <div className="bg-white rounded-xl p-2 mb-2 flex justify-center">
        <RadarChartWeb size={110} />
      </div>
      <div className="grid grid-cols-2 gap-1 mb-2">
        {[
          { l: 'Technisch', v: '7.5', color: '#1B6B4A' },
          { l: 'Tactisch', v: '6.8', color: '#2563EB' },
          { l: 'Fysiek', v: '8.2', color: '#D97706' },
          { l: 'Mentaal', v: '6.0', color: '#7C3AED' },
        ].map((s) => (
          <div key={s.l} className="bg-white rounded-md py-1 px-1.5">
            <div className="text-[9px] font-extrabold" style={{ color: s.color }}>{s.v}</div>
            <div className="text-[6px] text-[#6B7280]">{s.l}</div>
          </div>
        ))}
      </div>
      <div className="text-[8px] font-bold text-[#1A1A2E] mb-1">Actieve doelen</div>
      {[
        { title: 'Verbeter backhand push', attr: 'Technisch' },
        { title: 'Bouw sprintconditie op', attr: 'Fysiek' },
      ].map((g) => (
        <div key={g.title} className="bg-white rounded-xl p-2 mb-1 flex items-center justify-between">
          <div>
            <div className="text-[8px] font-semibold text-[#1A1A2E]">{g.title}</div>
            <div className="text-[6px] text-[#6B7280]">{g.attr}</div>
          </div>
          <div className="flex gap-1">
            <div className="w-5 h-5 bg-[#1B6B4A]/10 rounded-full flex items-center justify-center">
              <span className="text-[8px]">{'\u{1F44D}'}</span>
            </div>
            <div className="w-5 h-5 bg-[#1B6B4A]/10 rounded-full flex items-center justify-center">
              <span className="text-[8px]">{'\u{1F4AC}'}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ReflectionScreen() {
  return (
    <div className="w-full h-full bg-[#F8FAF9] flex flex-col pt-10 px-3">
      <div className="text-[11px] font-extrabold text-[#1A1A2E] mb-0.5">Reflectie</div>
      <div className="text-[8px] text-[#6B7280] mb-3">Training · Di 11 mrt</div>
      <div className="text-[8px] font-bold text-[#1A1A2E] mb-1.5">Focus doelen deze sessie</div>
      {[
        { title: 'Verbeter backhand push', score: 7 },
        { title: 'Bouw sprintconditie op', score: 6 },
      ].map((g) => (
        <div key={g.title} className="bg-white rounded-xl p-2.5 mb-1.5">
          <div className="text-[8px] font-semibold text-[#1A1A2E] mb-1">{g.title}</div>
          <div className="flex items-center gap-2">
            <div className="text-[7px] text-[#6B7280]">Score:</div>
            <div className="flex gap-0.5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className={`w-2.5 h-2.5 rounded-sm ${i < g.score ? 'bg-[#1B6B4A]' : 'bg-gray-200'}`} />
              ))}
            </div>
            <div className="text-[8px] font-bold text-[#1B6B4A]">{g.score}</div>
          </div>
        </div>
      ))}
      <div className="text-[8px] font-bold text-[#1A1A2E] mb-1 mt-1">Wat heb je geleerd?</div>
      <div className="bg-white rounded-xl p-2.5 mb-2">
        <div className="text-[7px] text-[#6B7280] leading-relaxed">
          Backhand push ging goed bij de passoefening, maar onder druk in het partijspel viel ik terug op forehand. Volgende keer bewust kiezen voor backhand in 1v1 situaties.
        </div>
      </div>
      <div className="text-[8px] font-bold text-[#1A1A2E] mb-1">Stemming</div>
      <div className="flex gap-2">
        {[
          { emoji: '\u{1F60A}', label: 'Goed', active: true },
          { emoji: '\u{1F610}', label: 'Oké', active: false },
          { emoji: '\u{1F614}', label: 'Matig', active: false },
        ].map((m) => (
          <div key={m.label} className={`flex-1 rounded-xl p-2 text-center ${m.active ? 'bg-[#1B6B4A]/10 border border-[#1B6B4A]/30' : 'bg-white'}`}>
            <div className="text-[14px]">{m.emoji}</div>
            <div className="text-[6px] text-[#6B7280] mt-0.5">{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const SCREENSHOT_SCREENS = [
  { label: 'Vaardigheidsprofiel', comp: <ProfileScreen />, group: 'athlete' },
  { label: 'Doelen & AI-feedback', comp: <GoalsScreen />, group: 'athlete' },
  { label: 'Ontwikkeling & XP', comp: <DevelopmentScreen />, group: 'athlete' },
  { label: 'Sessiereflectie', comp: <ReflectionScreen />, group: 'athlete' },
  { label: 'Teamoverzicht', comp: <CoachTeamScreen />, group: 'coach' },
  { label: 'Spelersprofiel', comp: <CoachPlayerScreen />, group: 'coach' },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      onClick={copy}
      className="text-xs px-2.5 py-1 rounded-md border border-deco-border bg-white hover:bg-gray-50 text-deco-text-secondary transition-colors"
      title={`Copy ${label}`}
    >
      {copied ? 'Copied!' : `Copy ${label}`}
    </button>
  );
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

// ─── Phone Frame for screenshots ────────────────────────────────────────────

function PhoneFrame({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative rounded-[2.5rem] border-[6px] border-gray-800 bg-gray-800 shadow-2xl overflow-hidden ${className}`}
      style={{ aspectRatio: '9/19.5' }}
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[35%] h-[22px] bg-gray-800 rounded-b-2xl z-10" />
      <div className="relative w-full h-full bg-white overflow-hidden rounded-[2rem]">
        {children}
      </div>
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-[35%] h-[4px] bg-gray-500 rounded-full z-10" />
    </div>
  );
}

function ScreenshotCard({ label, group, children }: { label: string; group: string; children: React.ReactNode }) {
  return (
    <div className="shrink-0 flex flex-col items-center">
      <PhoneFrame className="w-[180px]">
        {children}
      </PhoneFrame>
      <p className="text-xs font-medium text-deco-text mt-2">{label}</p>
      <p className="text-[10px] text-deco-text-secondary capitalize">{group}</p>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function AppStorePage() {
  const [builds, setBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/app-store')
      .then((r) => r.json())
      .then((d) => {
        setBuilds(d.builds || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load builds');
        setLoading(false);
      });
  }, []);

  if (loading) return <LoadingState cards={6} />;
  if (error) return <p className="text-red-600 text-sm">{error}</p>;

  const latest = builds[0];

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Page header */}
      <div>
        <h2 className="text-xl font-bold text-deco-text">App Store Hub</h2>
        <p className="text-sm text-deco-text-secondary mt-1">
          Everything you need to publish to Google Play &amp; Apple App Store
        </p>
      </div>

      {/* ── App Icon ────────────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-deco-border shadow-sm">
        <div className="px-6 py-4 border-b border-deco-border">
          <h3 className="font-semibold text-deco-text">App Icon</h3>
        </div>
        <div className="p-6 flex flex-wrap items-end gap-8">
          <div className="flex flex-col items-center gap-3">
            <img src="/images/icon.png" alt="Deco App Icon" className="w-32 h-32 rounded-[28px] shadow-lg border border-deco-border" />
            <span className="text-xs text-deco-text-secondary">1024 × 1024</span>
            <a href="/images/icon.png" download="deco-icon-1024.png" className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-deco-primary text-white hover:bg-deco-primary-dark transition-colors">
              <DownloadIcon /> Download PNG
            </a>
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="w-32 h-32 rounded-[28px] shadow-lg border border-deco-border overflow-hidden flex items-center justify-center bg-white">
              <img src="/images/favicon.svg" alt="Deco Favicon SVG" className="w-28 h-28" />
            </div>
            <span className="text-xs text-deco-text-secondary">SVG</span>
            <a href="/images/favicon.svg" download="deco-icon.svg" className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-deco-primary text-white hover:bg-deco-primary-dark transition-colors">
              <DownloadIcon /> Download SVG
            </a>
          </div>
          <div className="text-sm text-deco-text-secondary max-w-xs">
            <p className="font-medium text-deco-text mb-1">Requirements</p>
            <ul className="text-xs space-y-1 list-disc pl-4">
              <li>Google Play: 512×512 PNG (32-bit, no alpha)</li>
              <li>App Store: 1024×1024 PNG (no alpha, no rounded corners)</li>
              <li>Android adaptive icon assets in <code className="bg-gray-100 px-1 py-0.5 rounded">assets/images/</code></li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── App Identity ─────────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-deco-border shadow-sm">
        <div className="px-6 py-4 border-b border-deco-border">
          <h3 className="font-semibold text-deco-text">App Identity</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <MetaField label="App Name" value={STORE_META.appName} copyable />
          <MetaField label="Subtitle (iOS)" value={STORE_META.subtitle} copyable />
          <MetaField label="Bundle ID (iOS &amp; Android)" value={STORE_META.bundleId.ios} copyable />
          <MetaField label="Current Version" value={latest?.version || '-'} />
          <MetaField label="iOS Primary Category" value={STORE_META.iosCategory.primary} />
          <MetaField label="iOS Secondary Category" value={STORE_META.iosCategory.secondary} />
          <MetaField label="iOS Age Rating" value={STORE_META.iosAgeRating} />
          <MetaField label="Google Play Content Rating" value={STORE_META.contentRating} />
          <MetaField label="Copyright" value={STORE_META.copyright} copyable />
          <MetaField label="Default Language" value={STORE_META.defaultLanguage} />
        </div>
      </section>

      {/* ── Store Listing Text ───────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-deco-border shadow-sm">
        <div className="px-6 py-4 border-b border-deco-border">
          <h3 className="font-semibold text-deco-text">Store Listing Text</h3>
        </div>
        <div className="p-6 space-y-6">
          <TextBlock label="Short Description" value={STORE_META.shortDescription} maxChars={80} />
          <TextBlock label="Full Description" value={STORE_META.fullDescription} maxChars={4000} />
          <TextBlock label="What's New" value={STORE_META.whatsNew} maxChars={500} />
          <TextBlock label="Keywords (iOS)" value={STORE_META.keywords} maxChars={100} />
        </div>
      </section>

      {/* ── Links ────────────────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-deco-border shadow-sm">
        <div className="px-6 py-4 border-b border-deco-border">
          <h3 className="font-semibold text-deco-text">Links &amp; Contact</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <MetaField label="Marketing URL" value={STORE_META.marketingUrl} copyable link />
          <MetaField label="Privacy Policy URL" value={STORE_META.privacyUrl} copyable link />
          <MetaField label="Support URL (required for iOS)" value={STORE_META.supportUrl} copyable link />
          <MetaField label="Support Email" value={STORE_META.supportEmail} copyable />
        </div>
      </section>

      {/* ── iOS App Review Information ────────────────────────── */}
      <section className="bg-white rounded-xl border border-deco-border shadow-sm">
        <div className="px-6 py-4 border-b border-deco-border flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-deco-text">iOS App Review Information</h3>
            <p className="text-xs text-deco-text-secondary mt-0.5">Required in App Store Connect before submitting for review</p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-red-100 text-red-600">Apple Only</span>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-medium text-deco-text-secondary mb-1">First Name</p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-deco-text font-mono">Sando</span>
                <CopyButton text="Sando" label="First Name" />
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-deco-text-secondary mb-1">Last Name</p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-deco-text font-mono">van der Helm</span>
                <CopyButton text="van der Helm" label="Last Name" />
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-deco-text-secondary mb-1">Phone Number</p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-deco-text font-mono text-deco-text-secondary italic">Add your phone number</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-deco-text-secondary mb-1">Email</p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-deco-text font-mono">{STORE_META.supportEmail}</span>
                <CopyButton text={STORE_META.supportEmail} label="Email" />
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-medium text-deco-text-secondary">Notes for Reviewer (demo account &amp; instructions)</p>
              <CopyButton text={STORE_META.reviewNotes} label="Review Notes" />
            </div>
            <pre className="text-sm text-deco-text whitespace-pre-wrap bg-amber-50 rounded-lg p-4 border border-amber-200 leading-relaxed">{STORE_META.reviewNotes}</pre>
            <p className="text-[10px] text-deco-text-secondary mt-1.5">Make sure the demo account exists in Supabase before submitting for review.</p>
          </div>
        </div>
      </section>

      {/* ── iOS App Privacy Details ───────────────────────────── */}
      <section className="bg-white rounded-xl border border-deco-border shadow-sm">
        <div className="px-6 py-4 border-b border-deco-border flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-deco-text">iOS App Privacy Details</h3>
            <p className="text-xs text-deco-text-secondary mt-0.5">Complete in App Store Connect &rarr; App Privacy section</p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-red-100 text-red-600">Apple Only</span>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { category: 'Contact Info', types: 'Email address', use: 'Account management', linked: true, tracking: false },
              { category: 'Identifiers', types: 'User ID', use: 'App functionality', linked: true, tracking: false },
              { category: 'Usage Data', types: 'In-app actions (goals, reflections)', use: 'Analytics & app functionality', linked: true, tracking: false },
              { category: 'Diagnostics', types: 'Crash data', use: 'App improvement', linked: false, tracking: false },
            ].map((item) => (
              <div key={item.category} className="rounded-lg border border-deco-border p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-deco-text">{item.category}</span>
                  <div className="flex gap-1">
                    {item.linked && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">LINKED TO USER</span>}
                    {item.tracking && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">TRACKING</span>}
                  </div>
                </div>
                <p className="text-xs text-deco-text-secondary">{item.types}</p>
                <p className="text-[11px] text-deco-text-secondary mt-1">Purpose: {item.use}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 rounded-lg bg-green-50 border border-green-200">
            <p className="text-xs font-semibold text-green-800 mb-1">Data not collected</p>
            <p className="text-xs text-green-700">Location, Health &amp; Fitness, Financial Info, Browsing History, Purchases, Contacts, Messages, Photos, Audio/Video. No third-party advertising.</p>
          </div>
        </div>
      </section>

      {/* ── Screenshots ──────────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-deco-border shadow-sm">
        <div className="px-6 py-4 border-b border-deco-border flex items-center justify-between">
          <h3 className="font-semibold text-deco-text">Screenshots</h3>
          <div className="flex items-center gap-4">
            <a href="/admin/app-store/feature-graphic" className="text-xs font-medium text-deco-primary hover:underline">
              Feature Graphic Generator &rarr;
            </a>
            <a href="/admin/app-store/screenshots" className="text-xs font-medium text-deco-primary hover:underline">
              Screenshot Generator &rarr;
            </a>
          </div>
        </div>
        <div className="p-6">
          {/* Athlete screens */}
          <p className="text-xs font-medium text-deco-text mb-3">Athlete Screens</p>
          <div className="flex gap-5 overflow-x-auto pb-4">
            {SCREENSHOT_SCREENS.filter(s => s.group === 'athlete').map((s, i) => (
              <ScreenshotCard key={i} label={s.label} group={s.group}>{s.comp}</ScreenshotCard>
            ))}
          </div>

          {/* Coach screens */}
          <p className="text-xs font-medium text-deco-text mb-3 mt-6">Coach Screens</p>
          <div className="flex gap-5 overflow-x-auto pb-4">
            {SCREENSHOT_SCREENS.filter(s => s.group === 'coach').map((s, i) => (
              <ScreenshotCard key={i} label={s.label} group={s.group}>{s.comp}</ScreenshotCard>
            ))}
          </div>

          {/* Size requirements */}
          <div className="mt-6 bg-gray-50 rounded-xl border border-deco-border p-5">
            <p className="text-sm font-semibold text-deco-text mb-3">Screenshot Size Requirements</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-deco-text mb-2">Apple App Store</p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-deco-text-secondary">
                      <th className="pb-1 font-medium">Device</th>
                      <th className="pb-1 font-medium">Size (px)</th>
                      <th className="pb-1 font-medium">Required</th>
                    </tr>
                  </thead>
                  <tbody className="text-deco-text">
                    <tr className="border-t border-deco-border">
                      <td className="py-1.5">6.9&quot; iPhone 16 Pro Max</td>
                      <td className="py-1.5 font-mono">1320 × 2868</td>
                      <td className="py-1.5"><span className="text-red-500 font-semibold">Yes</span></td>
                    </tr>
                    <tr className="border-t border-deco-border">
                      <td className="py-1.5">6.7&quot; iPhone 15 Pro Max</td>
                      <td className="py-1.5 font-mono">1290 × 2796</td>
                      <td className="py-1.5"><span className="text-red-500 font-semibold">Yes</span></td>
                    </tr>
                    <tr className="border-t border-deco-border">
                      <td className="py-1.5">6.5&quot; iPhone 11 Pro Max</td>
                      <td className="py-1.5 font-mono">1284 × 2778</td>
                      <td className="py-1.5 text-deco-text-secondary">Recommended</td>
                    </tr>
                    <tr className="border-t border-deco-border">
                      <td className="py-1.5">5.5&quot; iPhone 8 Plus</td>
                      <td className="py-1.5 font-mono">1242 × 2208</td>
                      <td className="py-1.5 text-deco-text-secondary">If supporting</td>
                    </tr>
                    <tr className="border-t border-deco-border">
                      <td className="py-1.5">12.9&quot; iPad Pro (3rd gen+)</td>
                      <td className="py-1.5 font-mono">2048 × 2732</td>
                      <td className="py-1.5 text-deco-text-secondary">If supporting iPad</td>
                    </tr>
                    <tr className="border-t border-deco-border">
                      <td className="py-1.5">12.9&quot; iPad Pro (2nd gen)</td>
                      <td className="py-1.5 font-mono">2732 × 2048</td>
                      <td className="py-1.5 text-deco-text-secondary">If supporting iPad</td>
                    </tr>
                  </tbody>
                </table>
                <p className="text-[10px] text-deco-text-secondary mt-2">Min 2, max 10 per device. PNG or JPEG. No alpha channel.</p>
                <p className="text-[10px] text-amber-600 mt-1 font-medium">6.9&quot; and 6.7&quot; are required starting iOS 18 submissions.</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-deco-text mb-2">Google Play Store</p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-deco-text-secondary">
                      <th className="pb-1 font-medium">Type</th>
                      <th className="pb-1 font-medium">Size (px)</th>
                      <th className="pb-1 font-medium">Required</th>
                    </tr>
                  </thead>
                  <tbody className="text-deco-text">
                    <tr className="border-t border-deco-border">
                      <td className="py-1.5">Phone</td>
                      <td className="py-1.5 font-mono">1080 × 1920</td>
                      <td className="py-1.5"><span className="text-red-500 font-semibold">Yes (min 2)</span></td>
                    </tr>
                    <tr className="border-t border-deco-border">
                      <td className="py-1.5">Phone (tall)</td>
                      <td className="py-1.5 font-mono">1080 × 2400</td>
                      <td className="py-1.5 text-deco-text-secondary">Recommended</td>
                    </tr>
                    <tr className="border-t border-deco-border">
                      <td className="py-1.5">7&quot; Tablet</td>
                      <td className="py-1.5 font-mono">1200 × 1920</td>
                      <td className="py-1.5 text-deco-text-secondary">If supporting</td>
                    </tr>
                    <tr className="border-t border-deco-border">
                      <td className="py-1.5">10&quot; Tablet</td>
                      <td className="py-1.5 font-mono">1920 × 1200</td>
                      <td className="py-1.5 text-deco-text-secondary">If supporting</td>
                    </tr>
                    <tr className="border-t border-deco-border">
                      <td className="py-1.5">Feature Graphic</td>
                      <td className="py-1.5 font-mono">1024 × 500</td>
                      <td className="py-1.5"><span className="text-red-500 font-semibold">Yes</span></td>
                    </tr>
                  </tbody>
                </table>
                <p className="text-[10px] text-deco-text-secondary mt-2">Min 2, max 8 per device. PNG or JPEG, max 8MB each.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Builds / Releases ────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-deco-border shadow-sm">
        <div className="px-6 py-4 border-b border-deco-border flex items-center justify-between">
          <h3 className="font-semibold text-deco-text">Builds &amp; Releases</h3>
          <a href="https://github.com/sando-rev/deco/releases" target="_blank" rel="noopener noreferrer" className="text-xs text-deco-primary hover:underline">
            View on GitHub &rarr;
          </a>
        </div>
        <div className="divide-y divide-deco-border">
          {builds.map((build, i) => (
            <div key={build.version} className="px-6 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-deco-text">{build.version}</span>
                    {i === 0 && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-100 text-green-700">Latest</span>
                    )}
                    {build.prerelease && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Pre-release</span>
                    )}
                  </div>
                  {build.name !== build.version && (
                    <p className="text-sm text-deco-text-secondary mt-0.5">{build.name}</p>
                  )}
                  <p className="text-xs text-deco-text-secondary mt-1">{formatDate(build.publishedAt)}</p>
                  {build.body && (
                    <details className="mt-2">
                      <summary className="text-xs text-deco-primary cursor-pointer hover:underline">Release notes</summary>
                      <pre className="mt-2 text-xs text-deco-text-secondary whitespace-pre-wrap bg-gray-50 rounded-lg p-3 border border-deco-border max-h-48 overflow-y-auto">{build.body}</pre>
                    </details>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {build.apk && (
                    <a href={build.apk.downloadUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-deco-primary text-white hover:bg-deco-primary-dark transition-colors">
                      <DownloadIcon /> APK ({formatBytes(build.apk.size)})
                    </a>
                  )}
                  {build.aab && (
                    <a href={build.aab.downloadUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-deco-primary text-white hover:bg-deco-primary-dark transition-colors">
                      <DownloadIcon /> AAB ({formatBytes(build.aab.size)})
                    </a>
                  )}
                  <a href={build.url} target="_blank" rel="noopener noreferrer" className="text-xs text-deco-text-secondary hover:text-deco-primary" title="View on GitHub">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Submission Checklist ──────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-deco-border shadow-sm">
        <div className="px-6 py-4 border-b border-deco-border">
          <h3 className="font-semibold text-deco-text">Submission Checklist</h3>
          <p className="text-xs text-deco-text-secondary mt-0.5">Check off items as you complete them (state resets on refresh)</p>
        </div>
        <div className="p-6 space-y-6">

          {/* Apple App Store */}
          <div>
            <p className="text-xs font-semibold text-deco-text-secondary uppercase tracking-wider mb-3">Apple App Store</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
              {[
                { item: 'App icon 1024×1024 PNG (no alpha, no rounded corners)', status: 'ready' },
                { item: '6.9" iPhone 16 Pro Max screenshots (1320×2868)', status: 'action' },
                { item: '6.7" iPhone 15 Pro Max screenshots (1290×2796)', status: 'action' },
                { item: 'App name & subtitle', status: 'ready' },
                { item: 'Description & keywords', status: 'ready' },
                { item: 'What\'s New text', status: 'ready' },
                { item: 'Support URL', status: 'ready' },
                { item: 'Privacy Policy URL', status: 'ready' },
                { item: 'Copyright string', status: 'ready' },
                { item: 'Primary & secondary category', status: 'ready' },
                { item: 'Age rating questionnaire (target: 4+)', status: 'action' },
                { item: 'App Privacy Details (data types & purposes)', status: 'action' },
                { item: 'App Review contact info', status: 'ready' },
                { item: 'Demo account & review notes', status: 'action' },
                { item: 'Signed IPA uploaded via Xcode / Transporter', status: 'action' },
                { item: 'Build selected in App Store Connect', status: 'action' },
                { item: 'Export Compliance (encryption: standard HTTPS only)', status: 'action' },
              ].map((c) => (
                <label key={c.item} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 shrink-0 rounded border-gray-300 text-deco-primary focus:ring-deco-primary" />
                  <span className="text-sm text-deco-text">{c.item}</span>
                  {c.status === 'ready' && (
                    <span className="ml-auto shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">READY</span>
                  )}
                  {c.status === 'action' && (
                    <span className="ml-auto shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">TODO</span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Google Play Store */}
          <div>
            <p className="text-xs font-semibold text-deco-text-secondary uppercase tracking-wider mb-3">Google Play Store</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
              {[
                { item: 'App icon 512×512 PNG', status: 'ready' },
                { item: 'Feature graphic (1024×500)', status: 'ready' },
                { item: 'Phone screenshots (1080×1920, min 2)', status: 'action' },
                { item: 'Short description (≤80 chars)', status: 'ready' },
                { item: 'Full description', status: 'ready' },
                { item: 'Privacy policy URL', status: 'ready' },
                { item: 'Content rating questionnaire', status: 'action' },
                { item: 'Target audience & age declaration', status: 'action' },
                { item: 'Data safety form', status: 'action' },
                { item: 'Signed AAB uploaded to Play Console', status: 'action' },
              ].map((c) => (
                <label key={c.item} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 shrink-0 rounded border-gray-300 text-deco-primary focus:ring-deco-primary" />
                  <span className="text-sm text-deco-text">{c.item}</span>
                  {c.status === 'ready' && (
                    <span className="ml-auto shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">READY</span>
                  )}
                  {c.status === 'action' && (
                    <span className="ml-auto shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">TODO</span>
                  )}
                </label>
              ))}
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function MetaField({ label, value, copyable, link }: { label: string; value: string; copyable?: boolean; link?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium text-deco-text-secondary mb-1">{label}</p>
      <div className="flex items-center gap-2">
        {link ? (
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm text-deco-primary hover:underline truncate">{value}</a>
        ) : (
          <span className="text-sm text-deco-text font-mono truncate">{value}</span>
        )}
        {copyable && <CopyButton text={value} label={label} />}
      </div>
    </div>
  );
}

function TextBlock({ label, value, maxChars }: { label: string; value: string; maxChars: number }) {
  const charCount = value.length;
  const overLimit = charCount > maxChars;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs font-medium text-deco-text-secondary">{label}</p>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-mono ${overLimit ? 'text-red-500' : 'text-deco-text-secondary'}`}>
            {charCount}/{maxChars}
          </span>
          <CopyButton text={value} label={label} />
        </div>
      </div>
      <pre className="text-sm text-deco-text whitespace-pre-wrap bg-gray-50 rounded-lg p-4 border border-deco-border leading-relaxed">{value}</pre>
    </div>
  );
}
