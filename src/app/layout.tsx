import type { Metadata } from "next";
import { Fraunces, Inter, Bevan } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { isSupabaseConfigured } from "@/lib/env";
import InstallationPage from "./installation/page";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const bevan = Bevan({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bevan",
});

export const metadata: Metadata = {
  title: {
    default: "Mister 8 Tournament League",
    template: "%s · Mister 8 Tournament League",
  },
  description:
    "Le circuit compétitif de Mister 8 TCG à Courbevoie : tournois One Piece Card Game, inscriptions en ligne, classement de saison et qualification pour la grande finale.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const configured = isSupabaseConfigured();
  return (
    <html
      lang="fr"
      className={`${fraunces.variable} ${inter.variable} ${bevan.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Header />
        <main className="flex-1">{configured ? children : <InstallationPage />}</main>
        <Footer />
      </body>
    </html>
  );
}
