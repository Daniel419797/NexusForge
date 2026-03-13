import type { Metadata, Viewport } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import CookieConsentBanner from "@/components/CookieConsentBanner";

export const metadata: Metadata = {
  title: "NexusForge — Forge Your Backend. No Code. Full Power.",
  description: "Self-hosted, no-code Backend-as-a-Service. Multi-tenancy, real-time, AI agents, Web3/Base chain, x402 micropayments, and a vetted plugin marketplace.",
  keywords: ["BaaS", "Backend-as-a-Service", "No-Code", "AI", "Web3", "Base Chain", "x402", "Real-time", "Self-hosted", "Plugins"],
  authors: [{ name: "Daniel" }],
  openGraph: {
    title: "NexusForge — Forge Your Backend. No Code. Full Power.",
    description: "Self-hosted, no-code Backend-as-a-Service for the post-code era.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#020617",
  colorScheme: "dark",
};

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${dmSans.variable} ${jetbrainsMono.variable} antialiased grain relative`}>
        {children}
        <CookieConsentBanner />
      </body>
    </html>
  );
}
