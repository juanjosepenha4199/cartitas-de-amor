import type { Metadata } from "next";
import {
  Caveat,
  Cormorant_Garamond,
  DM_Sans,
  Great_Vibes,
  Indie_Flower,
  Nunito,
  Pacifico,
  Parisienne,
} from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ThemeRoot } from "@/components/theme-root";

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  weight: ["500", "600", "700"],
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["400", "500", "600", "700"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm",
  weight: ["400", "500", "600"],
});

const greatVibes = Great_Vibes({
  subsets: ["latin"],
  variable: "--font-great-vibes",
  weight: ["400"],
});

const parisienne = Parisienne({
  subsets: ["latin"],
  variable: "--font-parisienne",
  weight: ["400"],
});

const indieFlower = Indie_Flower({
  subsets: ["latin"],
  variable: "--font-indie",
  weight: ["400"],
});

const pacifico = Pacifico({
  subsets: ["latin"],
  variable: "--font-pacifico",
  weight: ["400"],
});

const nunitoRound = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito-round",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "GARDEN LETTERS — cartas en flor",
  description:
    "Crea y comparte cartas digitales con estética de sobres y flores. Un jardín romántico para dos.",
  icons: {
    icon: [{ url: "/garden-letters-icon.png", type: "image/png" }],
    apple: "/garden-letters-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${caveat.variable} ${cormorant.variable} ${dmSans.variable} ${greatVibes.variable} ${parisienne.variable} ${indieFlower.variable} ${pacifico.variable} ${nunitoRound.variable} min-h-screen antialiased`}
      >
        <Providers>
          <ThemeRoot>{children}</ThemeRoot>
        </Providers>
      </body>
    </html>
  );
}
