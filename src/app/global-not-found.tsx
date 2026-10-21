import type { Metadata } from "next";
import "@site/styles/style.css";

// With three root layouts (website, panel, admin) there is no top-level layout, so unmatched URLs render this page.
// It needs its own <html>/<body>. Styles and fonts are the website's, because a lost visitor is sent back there.
export const metadata: Metadata = {
  title: "Page not found — BattleTrader",
  icons: { icon: { url: "/assets/img/favicon.svg?v=2", type: "image/svg+xml" } },
};

const FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Cinzel:wght@400..900&family=Mulish:wght@400;500;600;700&family=Rajdhani:wght@500;600;700&family=JetBrains+Mono:wght@500;700&display=swap";

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- this page has no root layout to hold the fonts */}
        <link rel="stylesheet" href={FONTS_URL} />
      </head>
      <body>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "48px 24px", textAlign: "center" }}>
          <div>
            <p className="kick">Error 404</p>
            <h1>Page not found</h1>
            <p className="lead" style={{ margin: "16px auto 28px" }}>This page doesn&apos;t exist or has moved.</p>
            {/* Plain <a>: the target may sit under a different root layout, so a full page load is needed. */}
            <a className="btn b-ember" href="/">Back to BattleTrader</a>
          </div>
        </main>
      </body>
    </html>
  );
}
