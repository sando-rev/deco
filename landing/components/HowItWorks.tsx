export function HowItWorks() {
  const steps = [
    {
      num: 1,
      title: "Beoordeel",
      subtitle: "Weet waar je staat",
      description:
        "Kies vaardigheden die passen bij jouw positie en speelstijl — verdeeld over technisch, tactisch, fysiek en mentaal. Beoordeel jezelf en ontdek je unieke profiel in een radargrafiek.",
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          <line x1="2" y1="12" x2="22" y2="12" />
        </svg>
      ),
    },
    {
      num: 2,
      title: "Stel doelen",
      subtitle: "Kies je aandachtspunten",
      description:
        "Kies 2-3 vaardigheden om te ontwikkelen. Stel specifieke, meetbare en uitdagende doelen en ontvang direct AI-feedback om ze concreter en uitvoerbaarder te maken.",
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      ),
    },
    {
      num: 3,
      title: "Reflecteer & Groei",
      subtitle: "Zonder reflectie geen groei",
      description:
        "Reflecteren is het verschil tussen trainen en beter worden. Neem na elke sessie 2 minuten om te evalueren wat werkte, wat niet en wat je volgende keer anders doet. Zo vergeet je nooit meer waar je mee bezig bent.",
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
    },
  ];

  return (
    <section className="py-20 sm:py-28 bg-deco-bg">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-deco-text tracking-tight mb-4">
            Hoe het werkt
          </h2>
          <p className="text-base text-deco-text-secondary max-w-lg mx-auto">
            Drie eenvoudige stappen om te veranderen hoe je je ontwikkeling aanpakt.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-[2px] bg-deco-border" />

          {steps.map((step) => (
            <div key={step.num} className="relative text-center">
              <div className="w-24 h-24 bg-white rounded-2xl shadow-sm border border-deco-border flex items-center justify-center mx-auto mb-6 relative z-10 text-deco-primary">
                {step.icon}
              </div>
              <div className="inline-flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-deco-primary bg-deco-primary/10 w-6 h-6 rounded-full flex items-center justify-center">
                  {step.num}
                </span>
                <h3 className="text-lg font-bold text-deco-text">
                  {step.title}
                </h3>
              </div>
              <p className="text-xs font-semibold text-deco-primary mb-2">
                {step.subtitle}
              </p>
              <p className="text-sm text-deco-text-secondary leading-relaxed max-w-xs mx-auto">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
