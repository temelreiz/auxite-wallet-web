// next.config.ts
import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // ✅ Statik dağıtım (Next 15'te `next export` yerine bu kullanılır)
  output: "export",

  // ✅ S3/CloudFront üzerinde image optimizer yok
  images: {
    unoptimized: true,
  },

  // ✅ Statik hosting için genelde mantıklı
  trailingSlash: true,

  // (Opsiyonel ama faydalı)
  reactStrictMode: true,

  // ✅ Build'te tip ve lint davranışları
  typescript: {
    ignoreBuildErrors: false, // hataları yakalayalım
  },
  eslint: {
    ignoreDuringBuilds: true, // CI'da ESLint'i opsiyonel yap
  },

  // ✅ Turbopack kökünü bu proje klasörüne sabitle
  turbopack: {
    root: path.resolve(__dirname),
  },

  // (Opsiyonel) Küçük performans iyileştirmeleri
  // experimental: {
  //   typedRoutes: true,
  //   optimizePackageImports: ["wagmi", "viem", "@tanstack/react-query"],
  // },

  // DİKKAT:
  // - Static export ile 'rewrites', 'redirects', 'headers' çalışmaz.
  // - Webpack override (webpack(config){}) KULLANMAYIN — Turbopack uyarısına sebep olur.
};

export default nextConfig;
