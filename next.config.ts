import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Autorise l'accès au serveur de dev depuis le réseau local
  // (téléphone / tablette sur le même Wi-Fi).
  allowedDevOrigins: ["192.168.1.*", "192.168.0.*"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  // Bibliothèques Node utilisées dans les Route Handlers / Server Actions.
  serverExternalPackages: ["pdf-lib", "qrcode", "nodemailer", "@mollie/api-client"],
};

export default nextConfig;
