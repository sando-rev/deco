"use client";

import { useState } from "react";

const faqs = [
  {
    question: "Wat is Deco?",
    answer:
      "Deco is een hockey ontwikkelingsapp waarmee spelers doelen stellen, reflecteren na trainingen en wedstrijden, en hun groei bijhouden. Coaches kunnen de voortgang van hun spelers volgen en feedback geven.",
  },
  {
    question: "Is Deco gratis?",
    answer:
      "Ja, Deco is volledig gratis te gebruiken voor zowel spelers als coaches.",
  },
  {
    question: "Voor wie is Deco bedoeld?",
    answer:
      "Deco is gemaakt voor veldhockeyspelers van alle niveaus en hun coaches. Of je nu in de D-jeugd speelt of in de Hoofdklasse, Deco helpt je om gestructureerd aan je ontwikkeling te werken.",
  },
  {
    question: "Hoe werkt het puntensysteem?",
    answer:
      "Je verdient XP (experience points) door doelen te stellen, te reflecteren na trainingen en je vaardigheden te beoordelen. Hoe actiever je bezig bent met je ontwikkeling, hoe meer punten je verdient. Je kunt je ranglijst positie vergelijken met teamgenoten.",
  },
  {
    question: "Kan mijn coach meekijken?",
    answer:
      "Ja, coaches kunnen de voortgang van hun spelers volgen, feedback geven op doelen en weekrapporten schrijven. Spelers ontvangen een melding wanneer hun coach feedback geeft.",
  },
  {
    question: "Werkt Deco ook voor coaches?",
    answer:
      "Absoluut. Coaches hebben een eigen dashboard waarmee ze de ontwikkeling van al hun spelers kunnen volgen, individuele feedback kunnen geven en weekrapporten kunnen schrijven.",
  },
  {
    question: "Op welke apparaten werkt Deco?",
    answer:
      "Deco is beschikbaar als Android app. Een iOS versie is in ontwikkeling.",
  },
  {
    question: "Hoe beschermt Deco mijn gegevens?",
    answer:
      "Deco slaat je gegevens veilig op via Supabase (beveiligde cloud database). Je kunt je account en alle gegevens op elk moment verwijderen via de instellingen in de app. Lees meer in ons privacybeleid.",
  },
  {
    question: "Kan ik Deco gebruiken zonder team?",
    answer:
      "Ja, je kunt Deco ook individueel gebruiken om je eigen doelen en ontwikkeling bij te houden. Een team joinen is optioneel.",
  },
  {
    question: "Hoe begin ik?",
    answer:
      "Download de app, maak een account aan en doorloop de korte onboarding. Binnen een paar minuten heb je je profiel, eerste doelen en trainingsschema ingesteld.",
  },
];

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-5 h-5 text-deco-primary shrink-0 transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 8l5 5 5-5" />
    </svg>
  );
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section className="py-20 sm:py-28 bg-deco-bg">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-deco-text tracking-tight mb-4">
            Veelgestelde vragen
          </h2>
          <p className="text-base text-deco-text-secondary max-w-lg mx-auto">
            Alles wat je wilt weten over Deco, op een rij.
          </p>
        </div>

        <dl className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden"
              >
                <dt>
                  <button
                    type="button"
                    onClick={() => toggle(index)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left text-deco-text font-semibold text-sm sm:text-base hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deco-primary focus-visible:ring-inset"
                  >
                    <span>{faq.question}</span>
                    <ChevronIcon open={isOpen} />
                  </button>
                </dt>
                <dd
                  className={`overflow-hidden transition-all duration-200 ease-in-out ${isOpen ? "max-h-96" : "max-h-0"}`}
                  aria-hidden={!isOpen}
                >
                  <p className="px-5 pb-4 pt-1 text-sm sm:text-base text-deco-text-secondary leading-relaxed border-t border-gray-100">
                    {faq.answer}
                  </p>
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
