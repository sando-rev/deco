"use client";

import { PhoneMockup } from "./PhoneMockup";
import { RadarChartWeb } from "./RadarChartWeb";

interface ScreenshotGalleryProps {
  activeRole: "athlete" | "coach";
}

function AthleteProfileScreen() {
  return (
    <div className="w-full h-full bg-[#F8FAF9] flex flex-col pt-10 px-3">
      <div className="text-[11px] font-extrabold text-[#1A1A2E] mb-0.5">
        Welkom terug, Sarah
      </div>
      <div className="text-[8px] text-[#6B7280] mb-2">
        Jouw prestatieprofiel
      </div>
      <div className="bg-white rounded-xl p-2 mb-2 flex justify-center">
        <RadarChartWeb size={140} />
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { l: "DRI", v: 8 },
          { l: "PAS", v: 6 },
          { l: "SHO", v: 9 },
          { l: "DEF", v: 5 },
          { l: "FIT", v: 7 },
          { l: "INS", v: 4 },
          { l: "COM", v: 8 },
          { l: "MEN", v: 6 },
        ].map((s) => (
          <div key={s.l} className="bg-white rounded-lg py-1.5 text-center">
            <div className="text-xs font-extrabold text-[#1A1A2E]">{s.v}</div>
            <div className="text-[7px] text-[#6B7280]">{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AthleteGoalsScreen() {
  const goals = [
    {
      title: "Verbeter backhand nauwkeurigheid",
      attr: "Passen",
      progress: 70,
      target: 8,
    },
    {
      title: "Bouw sprintconditie op",
      attr: "Fitness",
      progress: 45,
      target: 7,
    },
    {
      title: "Leid de verdedigende druk",
      attr: "Communicatie",
      progress: 30,
      target: 9,
    },
  ];
  return (
    <div className="w-full h-full bg-[#F8FAF9] flex flex-col pt-10 px-3">
      <div className="text-[11px] font-extrabold text-[#1A1A2E] mb-2">
        Jouw doelen
      </div>
      <div className="flex gap-2 mb-3">
        <div className="bg-[#1B6B4A] text-white text-[8px] font-semibold px-2.5 py-1 rounded-full">
          Actief (3)
        </div>
        <div className="bg-gray-100 text-[#6B7280] text-[8px] font-semibold px-2.5 py-1 rounded-full">
          Behaald
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {goals.map((g) => (
          <div key={g.title} className="bg-white rounded-xl p-2.5">
            <div className="flex items-center justify-between mb-1">
              <div className="text-[9px] font-bold text-[#1A1A2E] leading-tight max-w-[70%]">
                {g.title}
              </div>
              <div className="text-[7px] bg-[#1B6B4A]/10 text-[#1B6B4A] px-1.5 py-0.5 rounded-full font-semibold">
                {g.attr}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1B6B4A] rounded-full"
                  style={{ width: `${g.progress}%` }}
                />
              </div>
              <div className="text-[7px] text-[#6B7280] font-semibold">
                Doel: {g.target}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 bg-[#F5A623]/10 rounded-xl p-2.5">
        <div className="text-[8px] font-bold text-[#F5A623] mb-0.5">
          AI Feedback
        </div>
        <div className="text-[7px] text-[#6B7280] leading-relaxed">
          Geweldig doel! Om het meetbaarder te maken, probeer een specifieke
          oefening toe te voegen die je 3x per week uitvoert...
        </div>
      </div>
    </div>
  );
}

function AthleteReflectionScreen() {
  return (
    <div className="w-full h-full bg-[#F8FAF9] flex flex-col pt-10 px-3">
      <div className="text-[11px] font-extrabold text-[#1A1A2E] mb-2">
        Sessiereflectie
      </div>
      <div className="flex gap-2 mb-3">
        <div className="bg-[#1B6B4A] text-white text-[8px] font-semibold px-2.5 py-1 rounded-full">
          Training
        </div>
        <div className="bg-gray-100 text-[#6B7280] text-[8px] font-semibold px-2.5 py-1 rounded-full">
          Wedstrijd
        </div>
      </div>
      <div className="text-[8px] font-semibold text-[#1A1A2E] mb-1.5">
        Beoordeel je doelen
      </div>
      {[
        { goal: "Verbeter backhand nauwkeurigheid", val: 7 },
        { goal: "Bouw sprintconditie op", val: 6 },
        { goal: "Leid de verdedigende druk", val: 8 },
      ].map((g) => (
        <div key={g.goal} className="bg-white rounded-xl p-2.5 mb-1.5">
          <div className="text-[8px] font-semibold text-[#1A1A2E] mb-1">
            {g.goal}
          </div>
          <div className="flex items-center gap-1">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1B6B4A] rounded-full"
                style={{ width: `${g.val * 10}%` }}
              />
            </div>
            <div className="w-5 h-5 bg-[#1B6B4A] rounded-full flex items-center justify-center">
              <span className="text-[7px] text-white font-bold">{g.val}</span>
            </div>
          </div>
        </div>
      ))}
      <div className="bg-white rounded-xl p-2.5 mt-1">
        <div className="text-[8px] font-semibold text-[#1A1A2E] mb-1">
          Notities
        </div>
        <div className="text-[7px] text-[#6B7280] leading-relaxed">
          Goed gefocust op backhandpassen tijdens positioneel spel. Moet harder
          pushen bij fitnessoefeningen de volgende keer...
        </div>
      </div>
    </div>
  );
}

function CoachTeamScreen() {
  const players = [
    { name: "Sarah van Dijk", score: "8.2", active: true },
    { name: "Emma Bakker", score: "6.8", active: true },
    { name: "Lisa de Vries", score: "7.5", active: false },
    { name: "Sophie Jansen", score: "5.9", active: true },
  ];
  return (
    <div className="w-full h-full bg-[#F8FAF9] flex flex-col pt-10 px-3">
      <div className="text-[11px] font-extrabold text-[#1A1A2E]">
        HC Amsterdam L1
      </div>
      <div className="text-[8px] text-[#6B7280] mb-2">4 spelers</div>
      <div className="bg-white rounded-xl p-2.5 mb-3 flex items-center justify-between">
        <div>
          <div className="text-[7px] text-[#6B7280]">Uitnodigingscode</div>
          <div className="text-[11px] font-mono font-extrabold text-[#1B6B4A] tracking-widest">
            AMS24X
          </div>
        </div>
        <div className="bg-[#1B6B4A]/10 text-[#1B6B4A] text-[7px] font-semibold px-2 py-1 rounded-full">
          Delen
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        {players.map((p) => (
          <div
            key={p.name}
            className="bg-white rounded-xl p-2.5 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#1B6B4A]/10 rounded-full flex items-center justify-center">
                <span className="text-[9px] font-bold text-[#1B6B4A]">
                  {p.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
              </div>
              <div>
                <div className="text-[9px] font-semibold text-[#1A1A2E]">
                  {p.name}
                </div>
                <div className="text-[7px] text-[#6B7280]">
                  Gem: {p.score}
                </div>
              </div>
            </div>
            <div
              className={`w-2 h-2 rounded-full ${
                p.active ? "bg-green-400" : "bg-gray-300"
              }`}
            />
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
          <div className="text-[10px] font-extrabold text-[#1A1A2E]">
            Sarah van Dijk
          </div>
          <div className="text-[7px] text-[#6B7280]">Laatst actief: Vandaag</div>
        </div>
      </div>
      <div className="bg-white rounded-xl p-2 mb-2 flex justify-center">
        <RadarChartWeb size={120} />
      </div>
      <div className="text-[8px] font-bold text-[#1A1A2E] mb-1">
        Actieve doelen
      </div>
      {[
        { title: "Verbeter backhand nauwkeurigheid", attr: "Passen" },
        { title: "Bouw sprintconditie op", attr: "Fitness" },
      ].map((g) => (
        <div
          key={g.title}
          className="bg-white rounded-xl p-2 mb-1 flex items-center justify-between"
        >
          <div>
            <div className="text-[8px] font-semibold text-[#1A1A2E]">
              {g.title}
            </div>
            <div className="text-[7px] text-[#6B7280]">{g.attr}</div>
          </div>
          <div className="flex gap-1">
            <div className="w-6 h-6 bg-[#1B6B4A]/10 rounded-full flex items-center justify-center">
              <span className="text-[10px]">👍</span>
            </div>
            <div className="w-6 h-6 bg-[#1B6B4A]/10 rounded-full flex items-center justify-center">
              <span className="text-[9px]">💬</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CoachFeedbackScreen() {
  return (
    <div className="w-full h-full bg-[#F8FAF9] flex flex-col pt-10 px-3">
      <div className="text-[11px] font-extrabold text-[#1A1A2E] mb-2">
        Doelfeedback
      </div>
      <div className="bg-white rounded-xl p-2.5 mb-2">
        <div className="text-[9px] font-bold text-[#1A1A2E] mb-0.5">
          Verbeter backhand nauwkeurigheid
        </div>
        <div className="text-[7px] text-[#6B7280] mb-2">
          Sarah van Dijk &middot; Passen
        </div>
        <div className="bg-[#1B6B4A]/5 rounded-lg p-2 mb-2">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-[10px]">👍</span>
            <div className="text-[7px] font-semibold text-[#1B6B4A]">
              Coach heeft dit doel goedgekeurd
            </div>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="text-[7px] font-semibold text-[#1A1A2E] mb-0.5">
            Coachreactie:
          </div>
          <div className="text-[7px] text-[#6B7280] leading-relaxed">
            Goede keuze Sarah! Focus vooral op je vlakke passen tijdens
            positioneel spel. Probeer de wandpasoefening die ik je vorige donderdag
            liet zien.
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl p-2.5">
        <div className="text-[9px] font-bold text-[#1A1A2E] mb-0.5">
          Bouw sprintconditie op
        </div>
        <div className="text-[7px] text-[#6B7280] mb-1.5">
          Sarah van Dijk &middot; Fitness
        </div>
        <div className="text-[7px] text-[#6B7280] italic">
          Nog geen feedback — tik om te reageren
        </div>
      </div>
    </div>
  );
}

export function ScreenshotGallery({ activeRole }: ScreenshotGalleryProps) {
  const screens =
    activeRole === "athlete"
      ? [
          { comp: <AthleteProfileScreen />, label: "Vaardigheidsprofiel" },
          { comp: <AthleteGoalsScreen />, label: "Slimme doelen" },
          { comp: <AthleteReflectionScreen />, label: "Reflecties" },
        ]
      : [
          { comp: <CoachTeamScreen />, label: "Teamoverzicht" },
          { comp: <CoachPlayerScreen />, label: "Spelersdetail" },
          { comp: <CoachFeedbackScreen />, label: "Doelfeedback" },
        ];

  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-end justify-center gap-6 sm:gap-8">
      {screens.map((screen, i) => (
        <div
          key={`${activeRole}-${i}`}
          className={`flex flex-col items-center ${
            i === 1 ? "sm:-translate-y-4" : ""
          }`}
        >
          <PhoneMockup
            className={`${
              i === 1 ? "w-[220px] sm:w-[240px]" : "w-[190px] sm:w-[210px]"
            }`}
          >
            {screen.comp}
          </PhoneMockup>
          <p className="text-sm font-semibold text-deco-text-secondary mt-3">
            {screen.label}
          </p>
        </div>
      ))}
    </div>
  );
}
