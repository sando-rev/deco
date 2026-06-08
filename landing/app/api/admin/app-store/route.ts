import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";

interface GHAsset {
  name: string;
  size: number;
  browser_download_url: string;
  download_count: number;
  created_at: string;
}

interface GHRelease {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  html_url: string;
  assets: GHAsset[];
  prerelease: boolean;
  draft: boolean;
}

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const res = await fetch(
      "https://api.github.com/repos/sando-rev/deco/releases?per_page=20",
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          ...(process.env.GITHUB_TOKEN
            ? { Authorization: `token ${process.env.GITHUB_TOKEN}` }
            : {}),
        },
        next: { revalidate: 60 },
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch releases" },
        { status: 502 }
      );
    }

    const releases: GHRelease[] = await res.json();

    const builds = releases
      .filter((r) => !r.draft)
      .map((r) => ({
        version: r.tag_name,
        name: r.name || r.tag_name,
        body: r.body || "",
        publishedAt: r.published_at,
        url: r.html_url,
        prerelease: r.prerelease,
        apk: r.assets.find((a) => a.name.endsWith(".apk"))
          ? {
              name: r.assets.find((a) => a.name.endsWith(".apk"))!.name,
              size: r.assets.find((a) => a.name.endsWith(".apk"))!.size,
              downloadUrl: r.assets.find((a) => a.name.endsWith(".apk"))!
                .browser_download_url,
              downloads: r.assets.find((a) => a.name.endsWith(".apk"))!
                .download_count,
            }
          : null,
        aab: r.assets.find((a) => a.name.endsWith(".aab"))
          ? {
              name: r.assets.find((a) => a.name.endsWith(".aab"))!.name,
              size: r.assets.find((a) => a.name.endsWith(".aab"))!.size,
              downloadUrl: r.assets.find((a) => a.name.endsWith(".aab"))!
                .browser_download_url,
              downloads: r.assets.find((a) => a.name.endsWith(".aab"))!
                .download_count,
            }
          : null,
      }));

    return NextResponse.json({ builds });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
