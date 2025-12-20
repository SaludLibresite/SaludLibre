/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configuración para resolver problemas con Turbopack y dependencias
  transpilePackages: ['@react-google-maps/api'],
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  images: {
    remotePatterns: [
      // Firebase Storage - formato estándar
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        port: "",
        pathname: "/v0/b/doctore-eae95.appspot.com/o/**",
      },
      // Firebase Storage - formato alternativo (para migración)
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        port: "",
        pathname: "/v0/b/doctore-eae95.firebasestorage.app/o/**",
      },
      // Google Cloud Storage - formato directo
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        port: "",
        pathname: "/doctore-eae95.appspot.com/**",
      },
      // Google Cloud Storage - formato alternativo
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        port: "",
        pathname: "/doctore-eae95.firebasestorage.app/**",
      },
      // Firebase Storage - dominios adicionales
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        port: "",
        pathname: "/**",
      },
      // Google User Profile Images
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
    ],
    // Permitir optimización de imágenes externas
    unoptimized: false,
    // Tiempo de vida del cache para imágenes optimizadas
    minimumCacheTTL: 60,
  },
};

export default nextConfig;
