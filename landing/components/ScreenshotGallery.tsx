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
        Welcome back, Sarah
      </div>
      <div className="text-[8px] text-[#6B7280] mb-2">
        Your performance profile
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
      title: "Improve backhand accuracy",
      attr: "Passing",
      progress: 70,
      target: 8,
    },
    {
      title: "Build sprint endurance",
      attr: "Fitness",
      progress: 45,
      target: 7,
    },
    {
      title: "Lead defensive press",
      attr: "Communication",
      progress: 30,
      target: 9,
    },
  ];
  return (
    <div className="w-full h-full bg-[#F8FAF9] flex flex-col pt-10 px-3">
      <div className="text-[11px] font-extrabold text-[#1A1A2E] mb-2">
        Your Goals
      </div>
      <div className="flex gap-2 mb-3">
        <div className="bg-[#1B6B4A] text-white text-[8px] font-semibold px-2.5 py-1 rounded-full">
          Active (3)
        </div>
        <div className="bg-gray-100 text-[#6B7280] text-[8px] font-semibold px-2.5 py-1 rounded-full">
          Achieved
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
                Target: {g.target}
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
          Great goal! To make it more measurable, try adding a specific drill
          you&apos;ll practice 3x per week...
        </div>
      </div>
    </div>
  );
}

function AthleteReflectionScreen() {
  return (
    <div className="w-full h-full bg-[#F8FAF9] flex flex-col pt-10 px-3">
      <div className="text-[11px] font-extrabold text-[#1A1A2E] mb-2">
        Session Reflection
      </div>
      <div className="flex gap-2 mb-3">
        <div className="bg-[#1B6B4A] text-white text-[8px] font-semibold px-2.5 py-1 rounded-full">
          Training
        </div>
        <div className="bg-gray-100 text-[#6B7280] text-[8px] font-semibold px-2.5 py-1 rounded-full">
          Match
        </div>
      </div>
      <div className="text-[8px] font-semibold text-[#1A1A2E] mb-1.5">
        Rate your goals
      </div>
      {[
        { goal: "Improve backhand accuracy", val: 7 },
        { goal: "Build sprint endurance", val: 6 },
        { goal: "Lead defensive press", val: 8 },
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
          Notes
        </div>
        <div className="text-[7px] text-[#6B7280] leading-relaxed">
          Focused well on backhand passes during positional play. Need to push
          harder in fitness drills next time...
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
      <div className="text-[8px] text-[#6B7280] mb-2">4 players</div>
      <div className="bg-white rounded-xl p-2.5 mb-3 flex items-center justify-between">
        <div>
          <div className="text-[7px] text-[#6B7280]">Invite Code</div>
          <div className="text-[11px] font-mono font-extrabold text-[#1B6B4A] tracking-widest">
            AMS24X
          </div>
        </div>
        <div className="bg-[#1B6B4A]/10 text-[#1B6B4A] text-[7px] font-semibold px-2 py-1 rounded-full">
          Share
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
                  Avg: {p.score}
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
          <div className="text-[7px] text-[#6B7280]">Last active: Today</div>
        </div>
      </div>
      <div className="bg-white rounded-xl p-2 mb-2 flex justify-center">
        <RadarChartWeb size={120} />
      </div>
      <div className="text-[8px] font-bold text-[#1A1A2E] mb-1">
        Active Goals
      </div>
      {[
        { title: "Improve backhand accuracy", attr: "Passing" },
        { title: "Build sprint endurance", attr: "Fitness" },
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
        Goal Feedback
      </div>
      <div className="bg-white rounded-xl p-2.5 mb-2">
        <div className="text-[9px] font-bold text-[#1A1A2E] mb-0.5">
          Improve backhand accuracy
        </div>
        <div className="text-[7px] text-[#6B7280] mb-2">
          Sarah van Dijk &middot; Passing
        </div>
        <div className="bg-[#1B6B4A]/5 rounded-lg p-2 mb-2">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-[10px]">👍</span>
            <div className="text-[7px] font-semibold text-[#1B6B4A]">
              Coach endorsed this goal
            </div>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="text-[7px] font-semibold text-[#1A1A2E] mb-0.5">
            Coach comment:
          </div>
          <div className="text-[7px] text-[#6B7280] leading-relaxed">
            Great choice Sarah! Focus especially on your flat passes during
            positional play. Try the wall-pass drill I showed you last Thursday.
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl p-2.5">
        <div className="text-[9px] font-bold text-[#1A1A2E] mb-0.5">
          Build sprint endurance
        </div>
        <div className="text-[7px] text-[#6B7280] mb-1.5">
          Sarah van Dijk &middot; Fitness
        </div>
        <div className="text-[7px] text-[#6B7280] italic">
          No feedback yet — tap to comment
        </div>
      </div>
    </div>
  );
}

export function ScreenshotGallery({ activeRole }: ScreenshotGalleryProps) {
  const screens =
    activeRole === "athlete"
      ? [
          { comp: <AthleteProfileScreen />, label: "Skill Profile" },
          { comp: <AthleteGoalsScreen />, label: "Smart Goals" },
          { comp: <AthleteReflectionScreen />, label: "Reflections" },
        ]
      : [
          { comp: <CoachTeamScreen />, label: "Team Overview" },
          { comp: <CoachPlayerScreen />, label: "Player Detail" },
          { comp: <CoachFeedbackScreen />, label: "Goal Feedback" },
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
