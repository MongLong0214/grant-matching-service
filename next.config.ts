import type { NextConfig } from "next";

const SUPABASE_PROJECT_ID = "jutlqmvhwsbfmwbxbvmj";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // DNS 프리페치 활성화 — 크롤러 및 사용자 연결 속도 향상
          { key: "X-DNS-Prefetch-Control", value: "on" },
          // Supabase 도메인 프리커넥트 — 첫 DB 쿼리 레이턴시 감소
          {
            key: "Link",
            value: `<https://${SUPABASE_PROJECT_ID}.supabase.co>; rel=preconnect, <https://fonts.gstatic.com>; rel=preconnect; crossorigin`,
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, x-sync-secret" },
        ],
      },
    ];
  },
};

export default nextConfig;
