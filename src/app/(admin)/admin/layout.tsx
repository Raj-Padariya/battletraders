import type { Metadata, Viewport } from "next";
import { THEME_SCRIPT } from "@admin/lib/ui";
import "@admin/styles/admin-base.css";

// Pages set `title: "Users"`; the template reproduces the old "<title>Users &mdash; BattleTrader Admin</title>".
export const metadata: Metadata = {
  title: { template: "%s — BattleTrader Admin", default: "BattleTrader Admin" },
  robots: { index: false, follow: false },
  icons: { icon: { url: "/admin/assets/img/favicon.svg?v=2", type: "image/svg+xml" } },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#07070C",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The pre-paint script sets data-theme before React hydrates, so the attribute legitimately differs.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- Satoshi is self-hosted; this sheet only supplies the mono face */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap" />
      </head>
      <body className="ad">{children}</body>
    </html>
  );
}
