import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      // El túnel de VS Code reescribe el Origin a "localhost:3000" pero envía el dominio del
      // túnel en x-forwarded-host; Next compara ambos, así que hay que permitir localhost.
      // "**" cubre varios subniveles (ej. abc-3000.use2.devtunnels.ms); "*" solo cubre uno.
      allowedOrigins: ["localhost:3000", "**.devtunnels.ms", "**.github.dev"],
    },
  },
  // Permite HMR y recursos de desarrollo al abrir la app por el túnel de VS Code
  allowedDevOrigins: ["**.devtunnels.ms", "**.github.dev"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
