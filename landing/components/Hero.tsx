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
            Onthoud elk{" "}
            <span className="text-deco-primary">ontwikkelpunt.</span>
          </h1>
          <p className="text-lg text-deco-text-secondary leading-relaxed mb-4 max-w-lg">
            Na een ontwikkelgesprek vergeten spelers binnen twee weken waar ze
            op moeten focussen. En als coach kun je onmogelijk van 15+ spelers
            onthouden wat ze doen.
          </p>
          <p className="text-lg text-deco-text leading-relaxed mb-8 max-w-lg font-medium">
            Deco lost dat op. Spelers stellen doelen, reflecteren na elke sessie
            en volgen hun groei. Coaches zien in één oogopslag waar iedereen aan
            werkt.
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
              <div className="grid grid-cols-2 gap-2 mt-4 w-full">
                {[
                  { label: "Technisch", val: "7.5", color: "text-deco-primary" },
                  { label: "Tactisch", val: "6.8", color: "text-blue-600" },
                  { label: "Fysiek", val: "8.2", color: "text-amber-600" },
                  { label: "Mentaal", val: "6.0", color: "text-purple-600" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="bg-white rounded-lg p-2 text-center"
                  >
                    <div className={`text-lg font-extrabold ${s.color}`}>
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
