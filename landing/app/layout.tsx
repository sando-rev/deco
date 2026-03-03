import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Deco — Development Coaching for Field Hockey",
  description:
    "Set goals, reflect after every session, and grow as a player. Deco keeps your development front and center — for athletes and coaches.",
  openGraph: {
    title: "Deco — Development Coaching for Field Hockey",
    description:
      "Set goals, reflect after every session, and grow as a player. Deco keeps your development front and center.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
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
