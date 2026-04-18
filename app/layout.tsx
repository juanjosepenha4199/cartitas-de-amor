import type { Metadata } from "next";
import { Caveat, Cormorant_Garamond, DM_Sans } from "next/font/google";
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

export const metadata: Metadata = {
  title: "GARDEN LETTERS — cartas en flor",
  description:
    "Crea y comparte cartas digitales con estética de sobres y flores. Un jardín romántico para dos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${caveat.variable} ${cormorant.variable} ${dmSans.variable} min-h-screen antialiased`}
      >
        <Providers>
          <ThemeRoot>{children}</ThemeRoot>
        </Providers>
      </body>
    </html>
  );
}
