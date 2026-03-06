export function Methodology() {
  const steps = [
    {
      num: "01",
      title: "Bewustzijn",
      description:
        "Weet waar je staat. Beoordeel jezelf op 8 vaardigheidsdimensies en zie je sterke punten en hiaten duidelijk.",
      color: "bg-deco-primary/10 text-deco-primary",
    },
    {
      num: "02",
      title: "Intentie",
      description:
        "Stel specifieke doelen voor de 2-3 gebieden die er het meest toe doen. AI-feedback zorgt ervoor dat je doelen uitvoerbaar zijn.",
      color: "bg-deco-accent/10 text-deco-accent",
    },
    {
      num: "03",
      title: "Bewust oefenen",
      description:
        "Elke training heeft een focus. Herinneringen voor de sessie houden je ontwikkelpunten centraal.",
      color: "bg-blue-50 text-blue-600",
    },
    {
      num: "04",
      title: "Groei",
      description:
        "Reflecteer, volg bij, herhaal. Zie je vaardigheden evolueren over weken en maanden van intentionele ontwikkeling.",
      color: "bg-green-50 text-green-600",
    },
  ];

  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-deco-text tracking-tight mb-4">
            Gebaseerd op hoe echte ontwikkeling werkt
          </h2>
          <p className="text-base text-deco-text-secondary leading-relaxed">
            Sportpsychologie laat zien dat groei een patroon volgt: bewustzijn
            van waar je staat, intentie om te verbeteren, gerichte oefening en
            reflectie. Deco maakt van deze cyclus een dagelijkse gewoonte.
          </p>
        </div>

        {/* The Problem */}
        <div className="bg-red-50 rounded-2xl p-6 sm:p-8 mb-8 border border-red-100">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
              <svg
                className="w-5 h-5 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M12 9v2m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-900 mb-2">
                Het probleem dat elke coach kent
              </h3>
              <p className="text-sm text-red-800/80 leading-relaxed">
                Een coach voert ontwikkelgesprekken met 15+ spelers. Elke
                speler krijgt de opdracht zich te richten op 2-3 verbeterpunten. Binnen enkele weken
                <span className="font-semibold"> vergeten beiden</span> wat er
                besproken is. Trainingen gaan voorbij zonder intentie. Het
                ontwikkelgesprek was voor niets.
              </p>
            </div>
          </div>
        </div>

        {/* The Solution - 4 Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((step) => (
            <div
              key={step.num}
              className="relative bg-deco-bg rounded-2xl p-6 border border-deco-border"
            >
              <div
                className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${step.color} text-sm font-bold mb-3`}
              >
                {step.num}
              </div>
              <h3 className="text-base font-bold text-deco-text mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-deco-text-secondary leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Connecting arrows (desktop only) */}
        <div className="hidden lg:flex justify-center items-center gap-4 -mt-[138px] mb-[100px] pointer-events-none px-16">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex-1 flex justify-end">
              <svg
                className="w-6 h-6 text-deco-text-tertiary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M9 5l7 7-7 7" />
              </svg>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
