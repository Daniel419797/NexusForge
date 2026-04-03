import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reuse API Tester — NexusForge",
  description: "Interactive testing harness for the Reuse backend platform",
};

export default function TestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-slate-950 text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
