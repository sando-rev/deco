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
import { Footer } from "@/components/Footer";

export default function Home() {
  const [role, setRole] = useState<"athlete" | "coach">("athlete");
  const featuresRef = useRef<HTMLDivElement>(null);

  const handleSelectRole = (newRole: "athlete" | "coach") => {
    setRole(newRole);
    featuresRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero onSelectRole={handleSelectRole} />

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

      <Methodology />
      <HowItWorks />
      <CTA />
      <Footer />
    </main>
  );
}
