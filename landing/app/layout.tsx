import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Deco — Ontwikkelcoaching voor hockey",
  description:
    "Stel doelen, reflecteer na elke sessie en groei als speler. Deco houdt jouw ontwikkeling centraal — voor spelers en coaches.",
  openGraph: {
    title: "Deco — Ontwikkelcoaching voor hockey",
    description:
      "Stel doelen, reflecteer na elke sessie en groei als speler. Deco houdt jouw ontwikkeling centraal.",
    type: "website",
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
        <link rel="icon" href="/images/icon.png" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-deco-bg text-deco-text antialiased">{children}</body>
    </html>
  );
}
