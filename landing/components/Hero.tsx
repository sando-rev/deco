"use client";

import { PhoneMockup } from "./PhoneMockup";
import { RadarChartWeb } from "./RadarChartWeb";

interface HeroProps {
  onSelectRole: (role: "athlete" | "coach") => void;
}

export function Hero({ onSelectRole }: HeroProps) {
  return (
    <section className="min-h-screen pt-24 pb-16 flex items-center bg-gradient-to-b from-deco-bg to-white">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left: Text */}
        <div>
          <div className="inline-block px-3 py-1 bg-deco-primary/10 text-deco-primary text-xs font-semibold rounded-full mb-6">
            Gemaakt voor hockey
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-deco-text leading-tight tracking-tight mb-6">
            Elke training,{" "}
            <span className="text-deco-primary">met intentie.</span>
          </h1>
          <p className="text-lg text-deco-text-secondary leading-relaxed mb-8 max-w-lg">
            Deco is een ontwikkelcoaching-app voor hockey. Spelers stellen
            doelen, reflecteren na elke sessie en volgen hun groei. Coaches
            blijven verbonden met het traject van elke speler.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onSelectRole("athlete")}
              className="bg-deco-primary text-white px-6 py-3 rounded-full font-semibold hover:bg-deco-primary-dark transition-colors"
            >
              Ik ben speler
            </button>
            <button
              onClick={() => onSelectRole("coach")}
              className="border-2 border-deco-primary text-deco-primary px-6 py-3 rounded-full font-semibold hover:bg-deco-primary hover:text-white transition-colors"
            >
              Ik ben coach
            </button>
          </div>
        </div>

        {/* Right: Phone mockup */}
        <div className="flex justify-center lg:justify-end">
          <PhoneMockup className="w-[260px] sm:w-[280px]">
            <div className="w-full h-full bg-deco-bg flex flex-col items-center pt-14 px-4">
              <div className="text-sm font-bold text-deco-text mb-1">
                Jouw profiel
              </div>
              <div className="text-[10px] text-deco-text-secondary mb-3">
                Prestatieoverzicht
              </div>
              <RadarChartWeb size={200} />
              <div className="grid grid-cols-4 gap-2 mt-4 w-full">
                {[
                  { label: "DRI", val: 8 },
                  { label: "PAS", val: 6 },
                  { label: "SHO", val: 9 },
                  { label: "DEF", val: 5 },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="bg-white rounded-lg p-2 text-center"
                  >
                    <div className="text-lg font-extrabold text-deco-text">
                      {s.val}
                    </div>
                    <div className="text-[8px] text-deco-text-secondary">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </PhoneMockup>
        </div>
      </div>
    </section>
  );
}
