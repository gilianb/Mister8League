import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Autorise l'accès au serveur de dev depuis le réseau local
  // (téléphone / tablette sur le même Wi-Fi).
  allowedDevOrigins: ["192.168.1.*", "192.168.0.*"],
};

export default nextConfig;
