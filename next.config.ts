import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // للسماح برفع المستندات (الحد الفعلي للملف 4 ميجا، انظر src/lib/files.ts)
    serverActions: { bodySizeLimit: "5mb" },
  },
};

export default nextConfig;
