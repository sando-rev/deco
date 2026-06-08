import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Blog — Deco Hockey Ontwikkeling",
  description:
    "Tips en inzichten over hockey ontwikkeling, doelen stellen, reflectie en coaching. Voor spelers en coaches die willen groeien.",
  alternates: {
    canonical: "https://decotraining.com/blog",
  },
  openGraph: {
    title: "Blog — Deco Hockey Ontwikkeling",
    description:
      "Tips en inzichten over hockey ontwikkeling, doelen stellen, reflectie en coaching.",
    type: "website",
    url: "https://decotraining.com/blog",
  },
};

export interface Post {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  author: string;
}

export const POSTS: Post[] = [
  {
    slug: "hockey-doelen-stellen",
    title: "5 hockey doelen die elke speler aan het begin van het seizoen moet stellen",
    date: "2026-03-20",
    excerpt:
      "Een nieuw seizoen is het perfecte moment om scherp te krijgen waar je als speler naartoe wilt. Ontdek hoe je met de SMART-methode doelen stelt die écht werken.",
    author: "Deco Team",
  },
  {
    slug: "effectief-reflecteren-na-training",
    title: "Hoe reflecteer je effectief na een hockeytraining?",
    date: "2026-03-22",
    excerpt:
      "Reflectie is de stille motor achter echte groei. Leer welke vragen je jezelf moet stellen na elke training en hoe je je inzichten bijhoudt.",
    author: "Deco Team",
  },
  {
    slug: "hockey-coach-feedback-geven",
    title: "Effectieve feedback geven als hockeycoach: 5 praktische tips",
    date: "2026-03-24",
    excerpt:
      "Goede feedback is een van de krachtigste instrumenten die een coach heeft. Ontdek hoe je feedback geeft die spelers écht verder helpt.",
    author: "Deco Team",
  },
  {
    slug: "hockey-apps-vergelijken",
    title: "De beste hockey apps van 2026: een vergelijking",
    date: "2026-03-26",
    excerpt:
      "Welke hockey app past bij jou? Vergelijk Deco, Sportlyzer, TeamSnap en andere tools voor spelers en coaches die willen groeien.",
    author: "Deco Team",
  },
  {
    slug: "hockey-skills-verbeteren",
    title: "De 10 belangrijkste hockey skills en hoe je ze verbetert",
    date: "2026-03-27",
    excerpt:
      "Van afstoppen tot de drag flick: ontdek welke technische vaardigheden het meest bepalend zijn voor je ontwikkeling en hoe je er doelgericht aan werkt.",
    author: "Deco Team",
  },
  {
    slug: "mentale-weerbaarheid-hockey",
    title: "Mentale weerbaarheid in hockey: 7 tips voor jonge spelers",
    date: "2026-03-29",
    excerpt:
      "Techniek en conditie zijn belangrijk, maar het zijn je hoofd dat bepaalt wie je op het veld bent. Leer hoe je mentaal sterker wordt met zeven concrete tips.",
    author: "Deco Team",
  },
  {
    slug: "hockey-training-schema",
    title: "Het perfecte hockey trainingsschema: zo plan je je week",
    date: "2026-04-01",
    excerpt:
      "Hoe je je week indeelt bepaalt hoe snel je groeit als hockeyspeler. Ontdek hoe je een effectief trainingsschema opbouwt met de juiste balans tussen belasting en herstel.",
    author: "Deco Team",
  },
  {
    slug: "gamification-sport",
    title: "Gamification in jeugdhockey: hoe XP en achievements motivatie verhogen",
    date: "2026-04-03",
    excerpt:
      "XP, badges en ranglijsten zijn meer dan spelletjes — ze zijn bewezen motivatietools. Ontdek hoe gamification werkt in jeugdsport en hoe Deco dit toepast.",
    author: "Deco Team",
  },
  {
    slug: "spelerontwikkeling-bijhouden",
    title: "Spelerontwikkeling digitaal bijhouden: waarom pen en papier niet meer werkt",
    date: "2026-04-06",
    excerpt:
      "Losse notities en Whatsapp-berichten schieten tekort als je spelers écht wilt begeleiden. Ontdek waarom digitale ontwikkelingsregistratie beter werkt voor coach en speler.",
    author: "Deco Team",
  },
  {
    slug: "hockey-keeper-training",
    title: "Hockey keeper training: specifieke oefeningen en doelen stellen",
    date: "2026-04-08",
    excerpt:
      "De keeper is de meest specialistische positie in hockey. Leer welke oefeningen het meeste opleveren en hoe je gerichte keepersdoelen stelt.",
    author: "Deco Team",
  },
  {
    slug: "hockey-seizoen-evaluatie",
    title: "Seizoenreflectie: zo evalueer je je hockeyseizoen effectief",
    date: "2026-04-10",
    excerpt:
      "Het seizoen zit erop. Nu begint het waardevolste moment van het jaar: de seizoenreflectie. Leer hoe je terugkijkt op een manier die je echt verder helpt.",
    author: "Deco Team",
  },
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Fetch published posts from the database, merge with static fallback.
// DB posts take priority for duplicate slugs.
async function getAllPosts(): Promise<Post[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("slug, title, date, excerpt, author")
      .eq("published", true)
      .order("date", { ascending: false });

    if (error || !data || data.length === 0) {
      return POSTS;
    }

    // Build a set of slugs that exist in the DB
    const dbSlugs = new Set(data.map((p) => p.slug));

    // Static posts that have no DB counterpart
    const staticFallbacks = POSTS.filter((p) => !dbSlugs.has(p.slug));

    // Combine: DB posts first (already DESC), then static fallbacks
    const combined: Post[] = [
      ...data.map((p) => ({
        slug:    p.slug,
        title:   p.title,
        date:    p.date,
        excerpt: p.excerpt ?? "",
        author:  p.author ?? "Deco Team",
      })),
      ...staticFallbacks,
    ];

    // Sort combined list by date DESC
    return combined.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } catch {
    // On any error fall back to the static list so the public page never breaks
    return POSTS;
  }
}

export default async function BlogIndexPage() {
  const allPosts = await getAllPosts();

  return (
    <div className="min-h-screen bg-deco-bg">
      <Navbar />

      <main className="pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <div className="mb-12 text-center">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-deco-primary mb-3">
              Blog
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-deco-primary-dark tracking-tight mb-4">
              Hockey ontwikkeling
            </h1>
            <p className="text-base text-deco-text-secondary max-w-xl mx-auto">
              Praktische tips en inzichten voor spelers en coaches die bewust willen groeien.
            </p>
          </div>

          {/* Post grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {allPosts.map((post) => (
              <article
                key={post.slug}
                className="bg-white rounded-2xl border border-deco-border p-6 flex flex-col hover:shadow-md transition-shadow"
              >
                <time
                  dateTime={post.date}
                  className="text-xs text-deco-text-tertiary font-medium mb-3"
                >
                  {formatDate(post.date)}
                </time>
                <h2 className="text-lg font-bold text-deco-primary-dark leading-snug mb-3">
                  {post.title}
                </h2>
                <p className="text-sm text-deco-text-secondary leading-relaxed mb-5 flex-1">
                  {post.excerpt}
                </p>
                <Link
                  href={`/blog/${post.slug}`}
                  className="text-sm font-semibold text-deco-primary hover:text-deco-primary-dark transition-colors"
                >
                  Lees meer &rarr;
                </Link>
              </article>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
