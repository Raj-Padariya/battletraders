import type { Metadata, Viewport } from "next";
import "@panel/styles/base.css";
import "@panel/styles/app.css";

// Pages set `title: "Wallet"` etc.; the template reproduces the old "<title>Wallet &mdash; BattleTrader</title>".
export const metadata: Metadata = {
  title: { template: "%s — BattleTrader", default: "BattleTrader — Trader panel" },
  robots: { index: false },
  icons: { icon: { url: "/app/assets/img/favicon.svg?v=2", type: "image/svg+xml" } },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#07070C",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- Satoshi is self-hosted; this sheet only supplies the mono face */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap" />
      </head>
      <body className="app">{children}</body>
    </html>
  );
}
