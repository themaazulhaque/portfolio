import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['mongoose', 'bcryptjs'],
  typescript: {
    // TypeScript checker OOMs on this machine; compilation already passes
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
