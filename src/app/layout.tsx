import type { Metadata, Viewport } from "next";
import { connection } from "next/server";
import { DM_Sans, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import { ToastProvider } from "@/components/ui/toast-provider";
import AuthInitializer from "@/components/Auth/AuthInitializer";

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

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Nonce-based CSP is injected per request in proxy.ts, so the app shell must render dynamically.
  await connection();

  return (
    <html lang="en" className="dark">
      <body className={`${dmSans.variable} ${jetbrainsMono.variable} ${spaceGrotesk.variable} antialiased grain relative`}>
        <AuthInitializer />
        <ToastProvider>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg">
          Skip to main content
        </a>
        {children}
        <CookieConsentBanner />
        </ToastProvider>
      </body>
    </html>
  );
}
