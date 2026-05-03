import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Common mistaken URL (e.g. tooling, bookmarks); app login lives at `/login`
      { source: "/auth/login", destination: "/login", permanent: false },
    ];
  },
};

export default nextConfig;
