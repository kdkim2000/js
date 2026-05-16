import type { NextConfig } from "next";

// output: 'export' only applies during production build (next build).
// Development server (next dev) runs without static export constraints
// so dynamic routes and API routes work normally.
const isExport = process.env.NEXT_EXPORT === "1";

const nextConfig: NextConfig = {
  ...(isExport ? { output: "export" } : {}),
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
