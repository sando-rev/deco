import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "De beste hockey apps van 2026 — Vergelijking | Deco",
  description:
    "Welke hockey app past bij jou? Vergelijk Deco, Sportlyzer, TeamSnap en andere tools voor spelers en coaches.",
  alternates: {
    canonical: "https://decotraining.com/blog/hockey-apps-vergelijken",
  },
  openGraph: {
    title: "De beste hockey apps van 2026 — Vergelijking | Deco",
    description:
      "Welke hockey app past bij jou? Vergelijk Deco, Sportlyzer, TeamSnap en andere tools voor spelers en coaches.",
    type: "article",
    url: "https://decotraining.com/blog/hockey-apps-vergelijken",
    publishedTime: "2026-03-26",
    authors: ["Deco Team"],
  },
  twitter: {
    card: "summary_large_image",
    title: "De beste hockey apps van 2026 — Vergelijking | Deco",
    description:
      "Welke hockey app past bij jou? Vergelijk Deco, Sportlyzer, TeamSnap en andere tools voor spelers en coaches.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "De beste hockey apps van 2026: een vergelijking",
  description:
    "Welke hockey app past bij jou? Vergelijk Deco, Sportlyzer, TeamSnap en andere tools voor spelers en coaches.",
  datePublished: "2026-03-26",
  dateModified: "2026-03-26",
  author: {
    "@type": "Organization",
    name: "Deco Team",
    url: "https://decotraining.com",
  },
  publisher: {
    "@type": "Organization",
    name: "Deco",
    url: "https://decotraining.com",
    logo: {
      "@type": "ImageObject",
      url: "https://decotraining.com/images/icon.png",
    },
  },
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": "https://decotraining.com/blog/hockey-apps-vergelijken",
  },
};

type Check = "ja" | "nee" | "deels";

interface AppRow {
  name: string;
  focus: string;
  speler: Check;
  coach: Check;
  gratis: Check;
  hockeySpecifiek: Check;
}

const APPS: AppRow[] = [
  {
    name: "Deco",
    focus: "Persoonlijke ontwikkeling, doelen, reflectie, AI-feedback",
    speler: "ja",
    coach: "ja",
    gratis: "ja",
    hockeySpecifiek: "ja",
  },
  {
    name: "Sportlyzer",
    focus: "Teammanagement, trainingsplanning",
    speler: "deels",
    coach: "ja",
    gratis: "nee",
    hockeySpecifiek: "nee",
  },
  {
    name: "TeamSnap",
    focus: "Planning, logistiek, communicatie",
    speler: "deels",
    coach: "ja",
    gratis: "deels",
    hockeySpecifiek: "nee",
  },
  {
    name: "Coach's Eye / Hudl",
    focus: "Videoanalyse en feedback",
    speler: "nee",
    coach: "ja",
    gratis: "nee",
    hockeySpecifiek: "nee",
  },
  {
    name: "Strava",
    focus: "Fitness- en GPS-tracking",
    speler: "ja",
    coach: "nee",
    gratis: "deels",
    hockeySpecifiek: "nee",
  },
  {
    name: "Pen & papier",
    focus: "Traditionele methode",
    speler: "ja",
    coach: "ja",
    gratis: "ja",
    hockeySpecifiek: "nee",
  },
];

function CheckBadge({ value }: { value: Check }) {
  if (value === "ja") {
    return (
      <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        Ja
      </span>
    );
  }
  if (value === "deels") {
    return (
      <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-600">
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
        </svg>
        Deels
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold text-deco-text-tertiary">
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
      Nee
    </span>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function HockeyAppsVergelijkenPage() {
  return (
    <div className="min-h-screen bg-deco-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Navbar />

      <main className="pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-6">
          {/* Breadcrumb */}
          <nav className="mb-8 text-sm text-deco-text-secondary" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-deco-primary transition-colors">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link href="/blog" className="hover:text-deco-primary transition-colors">
              Blog
            </Link>
            <span className="mx-2">/</span>
            <span className="text-deco-text">Hockey apps vergelijken</span>
          </nav>

          {/* Post header */}
          <header className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-deco-primary-dark leading-tight tracking-tight mb-4">
              De beste hockey apps van 2026: een vergelijking
            </h1>
            <div className="flex items-center gap-3 text-sm text-deco-text-tertiary">
              <span>Deco Team</span>
              <span>&middot;</span>
              <time dateTime="2026-03-26">{formatDate("2026-03-26")}</time>
            </div>
          </header>

          {/* Article body */}
          <article className="space-y-6 text-deco-text leading-relaxed text-base">
            <p>
              Het aanbod aan sportapps groeit snel, maar welke tool helpt jou als hockeyspeler of
              -coach écht verder? Niet elke app is gemaakt met hockey in gedachten, en veel tools
              lossen slechts een deel van het puzzel op. Of je nu je persoonlijke ontwikkeling wilt
              bijhouden, je team wilt organiseren of diepere feedback wilt ontvangen — de keuze
              bepaalt hoeveel je er uiteindelijk uithaalt. In dit artikel vergelijken we de
              belangrijkste apps naast elkaar, zodat je een weloverwogen keuze kunt maken.
            </p>

            {/* Comparison table */}
            <h2 className="text-2xl font-extrabold text-deco-primary-dark mt-10 mb-4">
              Vergelijkingstabel: hockey apps op een rij
            </h2>
            <p>
              De tabel hieronder geeft een snel overzicht van de zes meest gebruikte oplossingen.
              Let op de kolommen <em>Speler features</em> en <em>Hockey-specifiek</em> — dat zijn
              vaak de doorslaggevende factoren voor individuele ontwikkeling.
            </p>

            {/* Responsive scroll wrapper */}
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full min-w-[600px] border-collapse text-sm mt-4">
                <thead>
                  <tr className="bg-deco-primary-dark text-white">
                    <th className="text-left px-4 py-3 font-semibold rounded-tl-xl">App</th>
                    <th className="text-left px-4 py-3 font-semibold">Focus</th>
                    <th className="text-center px-4 py-3 font-semibold">Speler</th>
                    <th className="text-center px-4 py-3 font-semibold">Coach</th>
                    <th className="text-center px-4 py-3 font-semibold">Gratis</th>
                    <th className="text-center px-4 py-3 font-semibold rounded-tr-xl">
                      Hockey-specifiek
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {APPS.map((app, i) => {
                    const isDeco = app.name === "Deco";
                    const isEven = i % 2 === 0;
                    return (
                      <tr
                        key={app.name}
                        className={
                          isDeco
                            ? "bg-deco-primary/8 border border-deco-primary/30"
                            : isEven
                            ? "bg-white"
                            : "bg-deco-bg"
                        }
                      >
                        <td className="px-4 py-3 font-bold text-deco-primary-dark whitespace-nowrap">
                          {isDeco ? (
                            <span className="flex items-center gap-2">
                              {app.name}
                              <span className="text-[10px] font-extrabold uppercase tracking-wide bg-deco-accent text-deco-primary-dark px-1.5 py-0.5 rounded-full leading-none">
                                Aanbevolen
                              </span>
                            </span>
                          ) : (
                            app.name
                          )}
                        </td>
                        <td className="px-4 py-3 text-deco-text-secondary">{app.focus}</td>
                        <td className="px-4 py-3 text-center">
                          <CheckBadge value={app.speler} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <CheckBadge value={app.coach} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <CheckBadge value={app.gratis} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <CheckBadge value={app.hockeySpecifiek} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Per-app breakdown */}
            <h2 className="text-2xl font-extrabold text-deco-primary-dark mt-12 mb-3">
              Deco — gebouwd voor hockeyontwikkeling
            </h2>
            <p>
              Deco is de enige app in dit overzicht die volledig is ontworpen voor de individuele
              ontwikkeling van hockeyspelers. De kerngedachte is simpel: groei ontstaat door
              gerichte doelen te stellen, na elke training te reflecteren en structurele feedback
              van je coach te ontvangen. Deco koppelt die drie elementen aan elkaar in één
              overzichtelijke flow.
            </p>
            <p>
              Wat Deco onderscheidt is de combinatie van AI-gestuurde feedback op je doelen,
              gamificatie via XP en prestaties, en een coach-dashboard waarop trainers per speler
              kunnen zien hoe de ontwikkeling verloopt. Alles is gratis beschikbaar — zonder
              verborgen abonnementskosten.
            </p>
            <p>
              Voor teams en clubs is er een coach-omgeving waarmee de staf eenvoudig inzicht krijgt
              in de focuspunten van alle spelers. Zo worden individuele doelen zichtbaar op
              teamniveau, wat de communicatie tijdens trainingen concreter en gerichter maakt.
            </p>

            <h2 className="text-2xl font-extrabold text-deco-primary-dark mt-12 mb-3">
              Sportlyzer — sterk in teammanagement, minder in individuele groei
            </h2>
            <p>
              Sportlyzer is een volwassen platform dat coaches uitgebreide mogelijkheden biedt voor
              het plannen van trainingen, bijhouden van aanwezigheid en communiceren met spelers.
              Voor clubs die hun administratie willen digitaliseren is het een solide keuze.
            </p>
            <p>
              Wat Sportlyzer mist is een serieus individueel ontwikkeltraject voor de speler zelf.
              De app is gebouwd vanuit een coach-perspectief: de speler is primair een ontvanger van
              informatie, niet een actieve deelnemer aan zijn eigen groeiproces. Bovendien is
              Sportlyzer niet hockey-specifiek; de terminologie en structuur zijn generiek voor alle
              teamsporten.
            </p>
            <p>
              Het platform werkt op abonnementsbasis, wat voor kleinere clubs of individuele
              spelers een drempel kan zijn. Voor grote clubs met een dedicated technische staf kan de
              investering echter gerechtvaardigd zijn.
            </p>

            <h2 className="text-2xl font-extrabold text-deco-primary-dark mt-12 mb-3">
              TeamSnap — logistiek en communicatie, niet ontwikkeling
            </h2>
            <p>
              TeamSnap lost een ander probleem op: de chaos van teamlogistiek. Roosters, carpooling,
              beschikbaarheid en berichten — TeamSnap centraliseert dat. Voor ouders van jonge
              hockeyspelers is het populair omdat iedereen weet wanneer training is en wie rijdt.
            </p>
            <p>
              Als ontwikkeltool schiet TeamSnap echter ver tekort. Er zijn geen doelstellingen,
              geen reflectietool en geen feedbackmechanisme tussen coach en speler. Het is een
              communicatieplatform, geen coachingplatform. De gratis versie is beperkt; veel
              functies vereisen een betaald teamabonnement.
            </p>

            <h2 className="text-2xl font-extrabold text-deco-primary-dark mt-12 mb-3">
              Coach&apos;s Eye / Hudl — videoanalyse voor gevorderd gebruik
            </h2>
            <p>
              Tools als Coach&apos;s Eye en Hudl zijn krachtig als je beschikt over de tijd en
              middelen om video-analyse serieus te nemen. Coaches kunnen beelden annoteren, slow
              motion inzetten en spelers visueel laten zien wat er beter kan. Op hoog niveau, in
              professionele of nationale jeugdprogramma&apos;s, is dit een waardevolle aanvulling.
            </p>
            <p>
              Voor de gemiddelde club of individuele speler zijn deze tools echter overkill. Ze zijn
              prijzig, vereisen consistente video-opnames en hebben een leercurve. Bovendien zijn ze
              generiek van opzet en niet hockey-specifiek. Als aanvulling op een solide
              ontwikkelapp kunnen ze zinvol zijn; als enige tool zijn ze onvoldoende.
            </p>

            <h2 className="text-2xl font-extrabold text-deco-primary-dark mt-12 mb-3">
              Strava — populair, maar niet voor teamsporten
            </h2>
            <p>
              Strava is de meest gebruikte fitnessapp ter wereld en heeft zijn waarde bewezen voor
              hardlopers en wielrenners. Voor individuele conditietraining, bijhouden van
              kilometers of vergelijken met vrienden is het uitstekend. Maar Strava houdt op waar
              hockey begint.
            </p>
            <p>
              De app heeft geen begrip van technische hockeyvaardigheden, geen coachfunctionaliteit
              en geen teamcontext. GPS-tracking is zinvol voor duurlopen, maar legt niet vast of je
              eerste stick verbeterd is of hoe je tactisch positioneert. Voor hockeyontwikkeling
              biedt Strava geen meerwaarde.
            </p>

            <h2 className="text-2xl font-extrabold text-deco-primary-dark mt-12 mb-3">
              Pen &amp; papier — tijdloos, maar beperkt
            </h2>
            <p>
              Laten we eerlijk zijn: een notitieboekje en pen zijn nog steeds een prima manier om
              doelen op te schrijven en reflecties te noteren. Veel topsporters zweren bij fysiek
              schrijven. Het nadeel is de gebrek aan structuur, de onmogelijkheid om patronen te
              zien over langere tijd, en de afwezigheid van een feedbackloop met je coach.
            </p>
            <p>
              Als speler zie je niet hoe je doelen zich ontwikkelen over het seizoen. Als coach heb
              je geen zicht op wat je spelers bezighoudt. Pen en papier zijn een startpunt, geen
              systeem.
            </p>

            {/* Why Deco */}
            <h2 className="text-2xl font-extrabold text-deco-primary-dark mt-12 mb-4">
              Waarom Deco?
            </h2>
            <p>
              Na het bekijken van alle opties valt op dat er tot nu toe geen app bestaat die
              individuele hockeyontwikkeling, coachingfeedback en gamificatie combineert in één
              gratis pakket. Deco vult die leegte. Concreet:
            </p>
            <ul className="space-y-3 mt-4 pl-0 list-none">
              {[
                {
                  title: "Hockey-specifiek van de grond af",
                  body:
                    "Deco is gebouwd met en voor hockeyspelers. De doelcategorieën, reflectievragen en feedback sluiten aan op de realiteit van het spel.",
                },
                {
                  title: "Speler én coach in één app",
                  body:
                    "Spelers stellen doelen en reflecteren; coaches zien alles terug in een overzichtelijk dashboard en kunnen per speler reageren. Geen losse tools, geen e-mails.",
                },
                {
                  title: "AI-feedback die motiveert",
                  body:
                    "Na het vastleggen van een doel of reflectie geeft Deco directe, gepersonaliseerde AI-feedback. Niet generiek, maar gericht op jouw situatie en niveau.",
                },
                {
                  title: "Gratis, zonder verborgen kosten",
                  body:
                    "Alle kernfuncties zijn volledig gratis beschikbaar. Geen proefperiode, geen abonnement. Gewoon downloaden en starten.",
                },
              ].map((item) => (
                <li
                  key={item.title}
                  className="flex gap-3 bg-white border border-deco-border rounded-xl p-4"
                >
                  <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-deco-primary flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span>
                    <strong className="text-deco-primary-dark">{item.title}.</strong>{" "}
                    <span className="text-deco-text-secondary">{item.body}</span>
                  </span>
                </li>
              ))}
            </ul>
          </article>

          {/* CTA */}
          <div className="mt-14 bg-deco-primary-dark rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-extrabold text-white mb-3">
              Probeer Deco gratis
            </h2>
            <p className="text-deco-primary-light text-sm mb-6 max-w-sm mx-auto">
              Download Deco en begin vandaag met gerichte doelen, slimme reflectie en directe
              coachfeedback. Gratis, hockey-specifiek en direct beschikbaar.
            </p>
            <a
              href="https://decotraining.com/#download"
              className="inline-block bg-deco-accent text-deco-primary-dark font-bold px-8 py-3 rounded-full text-sm hover:bg-deco-accent-light transition-colors"
            >
              Download Deco
            </a>
          </div>

          {/* Back link */}
          <div className="mt-10 text-center">
            <Link
              href="/blog"
              className="text-sm text-deco-primary hover:text-deco-primary-dark font-semibold transition-colors"
            >
              &larr; Terug naar blog
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
