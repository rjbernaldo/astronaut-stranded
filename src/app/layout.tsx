import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ASTRONAUT: STRANDED - Survive the alien planet",
  description:
    "Top-down shooter game where you play as an astronaut stranded on a hostile alien planet. Survive waves of enemies, upgrade your weapons, and try to survive as long as possible!",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
