import type { NextConfig } from "next";

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "fkcqwx31dk.ufs.sh",
      },
    ],
  },
};
