import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "fkcqwx31dk.ufs.sh", // الدومين الخاص بمشروعك
      },
    ],
  },
};

export default nextConfig;
