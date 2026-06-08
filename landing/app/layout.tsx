import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://decotraining.com"),
  title: "Deco — Ontwikkelcoaching voor hockey",
  description:
    "Stel doelen, reflecteer na elke sessie en groei als speler. Deco houdt jouw ontwikkeling centraal — voor spelers en coaches.",
  alternates: {
    canonical: "https://decotraining.com",
  },
  openGraph: {
    title: "Deco — Ontwikkelcoaching voor hockey",
    description:
      "Stel doelen, reflecteer na elke sessie en groei als speler. Deco houdt jouw ontwikkeling centraal.",
    type: "website",
    url: "https://decotraining.com",
    images: [
      {
        url: "https://decotraining.com/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Deco — Ontwikkelcoaching voor hockey",
    description:
      "Stel doelen, reflecteer na elke sessie en groei als speler. Deco houdt jouw ontwikkeling centraal.",
    images: ["https://decotraining.com/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <head>
        <link rel="icon" href="/images/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/images/icon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/images/icon.png" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-deco-bg text-deco-text antialiased">{children}</body>
    </html>
  );
}
