import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { POSTS } from "../page";
import { createAdminClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PostHockeyDoelen } from "@/components/blog/PostHockeyDoelen";
import { PostReflecteren } from "@/components/blog/PostReflecteren";
import { PostCoachFeedback } from "@/components/blog/PostCoachFeedback";
import { PostHockeySkillsVerbeteren } from "@/components/blog/PostHockeySkillsVerbeteren";
import { PostMentaleWeerbaarheid } from "@/components/blog/PostMentaleWeerbaarheid";
import { PostHockeyTrainingSchema } from "@/components/blog/PostHockeyTrainingSchema";
import { PostGamificatieSport } from "@/components/blog/PostGamificatieSport";
import { PostSpelerontwikkelingBijhouden } from "@/components/blog/PostSpelerontwikkelingBijhouden";
import { PostHockeyKeeperTraining } from "@/components/blog/PostHockeyKeeperTraining";
import { PostHockeySeizoenevaluatie } from "@/components/blog/PostHockeySeizoenevaluatie";

// Static content components — kept as fallback for all pre-existing posts
const CONTENT_MAP: Record<string, React.FC> = {
  "hockey-doelen-stellen": PostHockeyDoelen,
  "effectief-reflecteren-na-training": PostReflecteren,
  "hockey-coach-feedback-geven": PostCoachFeedback,
  "hockey-skills-verbeteren": PostHockeySkillsVerbeteren,
  "mentale-weerbaarheid-hockey": PostMentaleWeerbaarheid,
  "hockey-training-schema": PostHockeyTrainingSchema,
  "gamification-sport": PostGamificatieSport,
  "spelerontwikkeling-bijhouden": PostSpelerontwikkelingBijhouden,
  "hockey-keeper-training": PostHockeyKeeperTraining,
  "hockey-seizoen-evaluatie": PostHockeySeizoenevaluatie,
};

// Attempt to load a DB post for a given slug.
// Returns null if not found or on error (static fallback will be used).
async function getDbPost(slug: string): Promise<{
  title: string;
  excerpt: string;
  author: string;
  date: string;
  content: string;
} | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("title, excerpt, author, date, content")
      .eq("slug", slug)
      .eq("published", true)
      .single();

    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

export function generateStaticParams() {
  return POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  // Prefer DB metadata, fall back to static POSTS array
  const dbPost = await getDbPost(slug);
  const staticPost = POSTS.find((p) => p.slug === slug);
  const post = dbPost ?? staticPost;
  if (!post) return {};

  return {
    title: `${post.title} — Deco Blog`,
    description: post.excerpt,
    alternates: {
      canonical: `https://decotraining.com/blog/${slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      url: `https://decotraining.com/blog/${slug}`,
      publishedTime: post.date,
      authors: [post.author],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    },
  };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Try DB first
  const dbPost = await getDbPost(slug);

  // Static fallback metadata
  const staticPost = POSTS.find((p) => p.slug === slug);

  // Must have at least a post record (either source)
  const post = dbPost ?? staticPost;
  if (!post) notFound();

  // For static-only slugs we still need a content component
  const ContentComponent = CONTENT_MAP[slug];
  if (!dbPost && !ContentComponent) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      "@type": "Organization",
      name: post.author,
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
      "@id": `https://decotraining.com/blog/${slug}`,
    },
  };

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
          <nav className="mb-8 text-sm text-deco-text-secondary">
            <Link href="/" className="hover:text-deco-primary transition-colors">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link href="/blog" className="hover:text-deco-primary transition-colors">
              Blog
            </Link>
            <span className="mx-2">/</span>
            <span className="text-deco-text">{post.title}</span>
          </nav>

          {/* Post header */}
          <header className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-deco-primary-dark leading-tight tracking-tight mb-4">
              {post.title}
            </h1>
            <div className="flex items-center gap-3 text-sm text-deco-text-tertiary">
              <span>{post.author}</span>
              <span>&middot;</span>
              <time dateTime={post.date}>{formatDate(post.date)}</time>
            </div>
          </header>

          {/* Article body — DB HTML content takes priority over static component */}
          {dbPost ? (
            <article
              className="prose-deco"
              dangerouslySetInnerHTML={{ __html: dbPost.content }}
            />
          ) : (
            <article className="prose-deco">
              {ContentComponent && <ContentComponent />}
            </article>
          )}

          {/* CTA */}
          <div className="mt-14 bg-deco-primary-dark rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-extrabold text-white mb-3">
              Klaar om te groeien?
            </h2>
            <p className="text-deco-primary-light text-sm mb-6 max-w-sm mx-auto">
              Probeer Deco gratis en ontdek hoe gerichte doelen, reflectie en coaching feedback jouw hockey naar een hoger niveau tillen.
            </p>
            <a
              href="https://play.google.com/store/apps/details?id=com.decotraining.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-deco-accent text-deco-primary-dark font-bold px-8 py-3 rounded-full text-sm hover:bg-deco-accent-light transition-colors"
            >
              Probeer Deco gratis
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
