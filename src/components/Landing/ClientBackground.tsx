"use client";

import dynamic from "next/dynamic";

const NeuralBackground = dynamic(
  () => import("@/components/Landing/NeuralBackground"),
  { ssr: false }
);

const CursorTrail = dynamic(
  () => import("@/components/Landing/CursorTrail"),
  { ssr: false }
);

export function ClientBackground() {
  return (
    <>
      <NeuralBackground />
      <CursorTrail />
    </>
  );
}
