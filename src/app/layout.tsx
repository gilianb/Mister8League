import type { Metadata } from "next";
import { Fraunces, Archivo } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { isSupabaseConfigured } from "@/lib/env";
import InstallationPage from "./installation/page";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-fraunces",
});

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
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
  // data-scroll-behavior : globals.css pose `scroll-behavior: smooth` pour les
  // ancres internes. Depuis Next 16, ce réglage n'est plus neutralisé pendant les
  // navigations — le retour en haut de page se ferait donc en glissant. L'attribut
  // rétablit la neutralisation, le temps de la navigation seulement.
  return (
    <html
      lang="fr"
      data-scroll-behavior="smooth"
      className={`${fraunces.variable} ${archivo.variable} h-full antialiased`}
    >
      {/* Les extensions du navigateur (Grammarly : data-gr-ext-installed…) ajoutent
          des attributs au <body> avant l'hydratation de React. suppressHydrationWarning
          ne porte que sur les attributs et le texte de cet élément, pas sur ses
          descendants : les vrais écarts d'hydratation restent signalés. */}
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Header />
        <main className="flex-1">{configured ? children : <InstallationPage />}</main>
        <Footer />
      </body>
    </html>
  );
}
