import type { Metadata, Viewport } from "next";
import "@site/styles/style.css";
import "@site/styles/home-tournaments.css";
import "@site/styles/ladder-home.css";

export const metadata: Metadata = {
  title: "BattleTrader — Simulated Trading Tournaments",
  description: "Simulated trading tournaments on live market data. Free daily battles, paid events with cash prizes, and one world championship a year.",
  icons: { icon: { url: "/assets/img/favicon.svg?v=2", type: "image/svg+xml" } },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#06040E",
};

// Satoshi is self-hosted (public/assets/fonts); Google Fonts only supplies the mono face used for figures.
const FONTS_URL = "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&display=swap";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- fonts are app-wide; this IS the root layout */}
        <link rel="stylesheet" href={FONTS_URL} />
      </head>
      <body>{children}</body>
    </html>
  );
}
