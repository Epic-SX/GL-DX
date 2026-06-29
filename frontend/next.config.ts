import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "8000" },
      { protocol: "http", hostname: "133.167.77.21" },
      { protocol: "https", hostname: "growlog-product-images.s3.ap-northeast-1.amazonaws.com" },
    ],
  },
};

export default nextConfig;
