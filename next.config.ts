import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const configDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: configDir
  },
  async rewrites() {
    return [
      { source: "/index.html", destination: "/" },
      { source: "/login.html", destination: "/login" },
      { source: "/register.html", destination: "/register" },
      { source: "/dashboard.html", destination: "/dashboard" },
      { source: "/cases.html", destination: "/cases" },
      { source: "/case-detail.html", destination: "/case-detail" },
      { source: "/assistant.html", destination: "/assistant" },
      { source: "/drafts.html", destination: "/drafts" },
      { source: "/timeline.html", destination: "/timeline" },
      { source: "/admin.html", destination: "/admin" },
      { source: "/settings.html", destination: "/settings" },
      { source: "/client-dashboard.html", destination: "/client-dashboard" },
      { source: "/css/:path*", destination: "/legacy/css/:path*" },
      { source: "/js/:path*", destination: "/legacy/js/:path*" },
      { source: "/assets/:path*", destination: "/legacy/assets/:path*" },
      { source: "/context/:path*", destination: "/legacy/context/:path*" }
    ];
  }
};

export default nextConfig;
