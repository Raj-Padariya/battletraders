import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

// One app serves the website (/), the user panel (/app/...) and the admin (/admin/...), each with its own root layout.
export default function config(phase: string): NextConfig {
  return {
    // Static export for the production build only; the dev server runs as a normal Next app.
    output: phase === PHASE_DEVELOPMENT_SERVER ? undefined : "export",
    trailingSlash: true,
    images: { unoptimized: true },
    // No top-level layout exists (each area has its own root layout), so 404s need app/global-not-found.tsx.
    experimental: { globalNotFound: true },
  };
}
