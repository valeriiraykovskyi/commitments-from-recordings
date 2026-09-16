import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The process route reads the bundled sample recordings from disk.
  outputFileTracingIncludes: {
    "/api/process": ["./public/samples/*.wav"],
  },
};

export default nextConfig;
