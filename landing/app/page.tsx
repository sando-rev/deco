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
              Everything you need to grow
            </h2>
            <p className="text-base text-deco-text-secondary max-w-lg mx-auto mb-8">
              {role === "athlete"
                ? "Track your skills, set smart goals, and reflect after every session. Deco keeps your development on track."
                : "Stay connected to every player's journey. Track goals, give feedback, and manage your team's growth."}
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
              See it in action
            </h2>
            <p className="text-base text-deco-text-secondary max-w-lg mx-auto">
              {role === "athlete"
                ? "Your development journey, visualized. From self-assessment to goal tracking to session reflections."
                : "Your team's development at your fingertips. From player profiles to goal feedback."}
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
