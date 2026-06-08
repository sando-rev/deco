"use client";

const ATHLETE_FEATURES = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    title: "Vaardigheidsprofiel",
    description:
      "Kies vaardigheden die passen bij jouw positie en speelstijl — van technisch en tactisch tot fysiek en mentaal. Jouw radargrafiek laat zien waar je staat.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    title: "Slim doelen stellen",
    description:
      "Stel specifieke, meetbare en uitdagende ontwikkeldoelen. Onze AI analyseert elk doel en geeft je feedback om het concreter en uitvoerbaarder te maken.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    title: "Reflecteren na elke sessie",
    description:
      "Reflectie is dé sleutel tot groei. Neem na elke training of wedstrijd 2 minuten om te evalueren wat je deed, wat werkte en wat beter kan. Zo vergeet je nooit meer waar je aan werkt.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    title: "Ontwikkeling volgen",
    description:
      "Zie je vaardigheidsprofiel in de loop van de tijd evolueren. Bekijk trends, reeksen en voortgangsgrafieken per doel.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    title: "XP & Achievements",
    description:
      "Verdien XP voor doelen, reflecties en groei. Ontgrendel achievements en volg je streak — leren voelt als een game.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <polyline points="17 11 19 13 23 9" />
      </svg>
    ),
    title: "Teamranglijst",
    description:
      "Bekijk hoe je het doet vergeleken met je teamgenoten. XP, streaks en behaalde doelen — wie groeit het hardst?",
  },
];

const COACH_FEATURES = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: "Nooit meer vergeten",
    description:
      "Je voert ontwikkelgesprekken met 15+ spelers. Onmogelijk om te onthouden wie waaraan werkt. Deco houdt het bij — jij focust op coachen.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4l3 3" />
      </svg>
    ),
    title: "Doeloverzicht",
    description:
      "Bekijk in één scherm de actieve ontwikkeldoelen van al je spelers. Weet precies waar iedereen aan werkt, zonder iets te hoeven onthouden.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 3v18" />
      </svg>
    ),
    title: "Spelersprofielen",
    description:
      "Bekijk het vaardigheidsprofiel van elke speler in één oogopslag. Begrijp direct de sterke punten en verbeterpunten per categorie.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
        <path d="M1 12h4" />
      </svg>
    ),
    title: "Feedback & Aanmoediging",
    description:
      "Geef een duimpje omhoog of schrijf een reactie op spelerdoelen. Kleine aanmoedigingen maken een groot verschil.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
    title: "Activiteitenmonitoring",
    description:
      "Zie welke spelers actief reflecteren en groeien. Signaleer afhaken vroegtijdig en grijp in.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "Teambeheer",
    description:
      "Maak je team aan en nodig spelers uit met een eenvoudige code. Voeg je volledige selectie in minuten toe.",
  },
];

interface FeatureShowcaseProps {
  activeRole: "athlete" | "coach";
}

export function FeatureShowcase({ activeRole }: FeatureShowcaseProps) {
  const features = activeRole === "athlete" ? ATHLETE_FEATURES : COACH_FEATURES;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {features.map((feature, i) => (
        <div
          key={`${activeRole}-${i}`}
          className="bg-white rounded-2xl p-6 border border-deco-border hover:border-deco-primary/30 hover:shadow-lg transition-all duration-300"
        >
          <div className="w-10 h-10 bg-deco-primary/10 rounded-xl flex items-center justify-center text-deco-primary mb-4">
            {feature.icon}
          </div>
          <h3 className="text-base font-bold text-deco-text mb-2">
            {feature.title}
          </h3>
          <p className="text-sm text-deco-text-secondary leading-relaxed">
            {feature.description}
          </p>
        </div>
      ))}
    </div>
  );
}
