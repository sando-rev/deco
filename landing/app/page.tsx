"use client";

import { useState, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { RoleToggle } from "@/components/RoleToggle";
import { FeatureShowcase } from "@/components/FeatureShowcase";
import { ScreenshotGallery } from "@/components/ScreenshotGallery";
import { Methodology } from "@/components/Methodology";
import { HowItWorks } from "@/components/HowItWorks";
import { CTA } from "@/components/CTA";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";

export default function Home() {
  const [role, setRole] = useState<"athlete" | "coach">("athlete");
  const featuresRef = useRef<HTMLDivElement>(null);

  const handleSelectRole = (newRole: "athlete" | "coach") => {
    setRole(newRole);
    featuresRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: "Deco",
        url: "https://decotraining.com",
        description:
          "Ontwikkelcoaching voor hockey — stel doelen, reflecteer en groei als speler.",
      },
      {
        "@type": "SoftwareApplication",
        name: "Deco",
        applicationCategory: "SportsApplication",
        operatingSystem: "Android",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "EUR",
        },
        description:
          "Hockey ontwikkelcoaching app voor spelers en coaches. Stel doelen, reflecteer na elke sessie en groei als speler.",
        downloadUrl: "https://decotraining.com/#download",
      },
      {
        "@type": "Organization",
        name: "Deco Training",
        url: "https://decotraining.com",
        logo: "https://decotraining.com/icon.png",
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "Wat is Deco?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Deco is een hockey ontwikkelingsapp waarmee spelers doelen stellen, reflecteren na trainingen en wedstrijden, en hun groei bijhouden. Coaches kunnen de voortgang van hun spelers volgen en feedback geven.",
            },
          },
          {
            "@type": "Question",
            name: "Is Deco gratis?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Ja, Deco is volledig gratis te gebruiken voor zowel spelers als coaches.",
            },
          },
          {
            "@type": "Question",
            name: "Voor wie is Deco bedoeld?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Deco is gemaakt voor veldhockeyspelers van alle niveaus en hun coaches. Of je nu in de D-jeugd speelt of in de Hoofdklasse, Deco helpt je om gestructureerd aan je ontwikkeling te werken.",
            },
          },
          {
            "@type": "Question",
            name: "Hoe werkt het puntensysteem?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Je verdient XP (experience points) door doelen te stellen, te reflecteren na trainingen en je vaardigheden te beoordelen. Hoe actiever je bezig bent met je ontwikkeling, hoe meer punten je verdient. Je kunt je ranglijst positie vergelijken met teamgenoten.",
            },
          },
          {
            "@type": "Question",
            name: "Kan mijn coach meekijken?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Ja, coaches kunnen de voortgang van hun spelers volgen, feedback geven op doelen en weekrapporten schrijven. Spelers ontvangen een melding wanneer hun coach feedback geeft.",
            },
          },
          {
            "@type": "Question",
            name: "Werkt Deco ook voor coaches?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Absoluut. Coaches hebben een eigen dashboard waarmee ze de ontwikkeling van al hun spelers kunnen volgen, individuele feedback kunnen geven en weekrapporten kunnen schrijven.",
            },
          },
          {
            "@type": "Question",
            name: "Op welke apparaten werkt Deco?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Deco is beschikbaar als Android app. Een iOS versie is in ontwikkeling.",
            },
          },
          {
            "@type": "Question",
            name: "Hoe beschermt Deco mijn gegevens?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Deco slaat je gegevens veilig op via Supabase (beveiligde cloud database). Je kunt je account en alle gegevens op elk moment verwijderen via de instellingen in de app. Lees meer in ons privacybeleid.",
            },
          },
          {
            "@type": "Question",
            name: "Kan ik Deco gebruiken zonder team?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Ja, je kunt Deco ook individueel gebruiken om je eigen doelen en ontwikkeling bij te houden. Een team joinen is optioneel.",
            },
          },
          {
            "@type": "Question",
            name: "Hoe begin ik?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Download de app, maak een account aan en doorloop de korte onboarding. Binnen een paar minuten heb je je profiel, eerste doelen en trainingsschema ingesteld.",
            },
          },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <Hero onSelectRole={handleSelectRole} />

      <Methodology />

      {/* Features Section */}
      <section
        ref={featuresRef}
        className="py-20 sm:py-28 bg-deco-bg scroll-mt-16"
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-deco-text tracking-tight mb-4">
              Alles wat je nodig hebt om te groeien
            </h2>
            <p className="text-base text-deco-text-secondary max-w-lg mx-auto mb-8">
              {role === "athlete"
                ? "Volg je vaardigheden, stel slimme doelen en reflecteer na elke sessie. Deco houdt jouw ontwikkeling op koers."
                : "Blijf verbonden met het traject van elke speler. Volg doelen, geef feedback en begeleid de groei van je team."}
            </p>
            <RoleToggle activeRole={role} onRoleChange={setRole} />
          </div>
          <FeatureShowcase activeRole={role} />
        </div>
      </section>

      {/* Screenshots Section */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-deco-text tracking-tight mb-4">
              Bekijk het in actie
            </h2>
            <p className="text-base text-deco-text-secondary max-w-lg mx-auto">
              {role === "athlete"
                ? "Jouw ontwikkeltraject, visueel gemaakt. Van zelfevaluatie tot doeltracking en sessiereflecties."
                : "De ontwikkeling van je team binnen handbereik. Van spelersprofielen tot doeloverzicht en feedback."}
            </p>
          </div>
          <ScreenshotGallery activeRole={role} />
        </div>
      </section>

      <HowItWorks />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}
