import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://decotraining.com",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://decotraining.com/privacy",
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: "https://decotraining.com/deletedata",
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: "https://decotraining.com/blog",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: "https://decotraining.com/blog/hockey-doelen-stellen",
      lastModified: new Date("2026-03-20"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://decotraining.com/blog/effectief-reflecteren-na-training",
      lastModified: new Date("2026-03-22"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://decotraining.com/blog/hockey-coach-feedback-geven",
      lastModified: new Date("2026-03-24"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://decotraining.com/blog/hockey-apps-vergelijken",
      lastModified: new Date("2026-03-26"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://decotraining.com/blog/hockey-skills-verbeteren",
      lastModified: new Date("2026-03-27"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://decotraining.com/blog/mentale-weerbaarheid-hockey",
      lastModified: new Date("2026-03-29"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://decotraining.com/blog/hockey-training-schema",
      lastModified: new Date("2026-04-01"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://decotraining.com/blog/gamification-sport",
      lastModified: new Date("2026-04-03"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://decotraining.com/blog/spelerontwikkeling-bijhouden",
      lastModified: new Date("2026-04-06"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://decotraining.com/blog/hockey-keeper-training",
      lastModified: new Date("2026-04-08"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://decotraining.com/blog/hockey-seizoen-evaluatie",
      lastModified: new Date("2026-04-10"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];
}
