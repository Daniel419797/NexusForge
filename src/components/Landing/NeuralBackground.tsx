"use client";

import { useRef, useEffect, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Color, Vector2, AdditiveBlending } from "three";
import type { Points, LineSegments, BufferAttribute } from "three";

/* ────────────────────────────────────────────
   Neural network constellation – WebGL scene
   Orbiting nodes connected by glowing edges
   that pulse on mouse proximity & scroll
   ──────────────────────────────────────────── */

const NODE_COUNT = 80;        // ← reduced from 120 for perf
const MAX_DIST_SQ = 3.2 * 3.2; // squared distance — avoids sqrt
const MAX_EDGES = 1600;         // ← reduced proportionally

// Deterministic seeded random – avoids Math.random() in render
function seededRandom(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// Pre-generate all particle data at module scope (pure, runs once)
function generateParticleData() {
  const pos = new Float32Array(NODE_COUNT * 3);
  const vel = new Float32Array(NODE_COUNT * 3);
  const col = new Float32Array(NODE_COUNT * 3);
  const cyan = new Color("#00f0ff");
  const magenta = new Color("#ff00e5");
  const purple = new Color("#a855f7");
  const palette = [cyan, magenta, purple];

  for (let i = 0; i < NODE_COUNT; i++) {
    const r = 4 + seededRandom(i * 6 + 0) * 5;
    const theta = seededRandom(i * 6 + 1) * Math.PI * 2;
    const phi = Math.acos(2 * seededRandom(i * 6 + 2) - 1);
    pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i * 3 + 2] = (seededRandom(i * 6 + 3) - 0.5) * 4;
    vel[i * 3] = (seededRandom(i * 6 + 4) - 0.5) * 0.003;
    vel[i * 3 + 1] = (seededRandom(i * 6 + 5) - 0.5) * 0.003;
    vel[i * 3 + 2] = (seededRandom(i * 6 + 3.5) - 0.5) * 0.001;
    const c = palette[Math.floor(seededRandom(i * 6 + 2.5) * palette.length)];
    col[i * 3] = c.r;
    col[i * 3 + 1] = c.g;
    col[i * 3 + 2] = c.b;
  }
  return { positions: pos, velocities: vel, colors: col };
}

const PARTICLE_DATA = generateParticleData();

function NeuralParticles() {
  const pointsRef = useRef<Points>(null!);
  const linesRef = useRef<LineSegments>(null!);
  const mouseRef = useRef(new Vector2(0, 0));
  const linePosRef = useRef(new Float32Array(MAX_EDGES * 6));
  const lineColRef = useRef(new Float32Array(MAX_EDGES * 6));
  const { viewport } = useThree();

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      mouseRef.current.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );
    },
    []
  );

  // Track pointer globally via useEffect (not useMemo)
  useEffect(() => {
    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [handlePointerMove]);

  useFrame((_state, delta) => {
    const time = _state.clock.getElapsedTime();
    const pts = pointsRef.current;
    if (!pts) return;

    const posAttr = pts.geometry.attributes.position as BufferAttribute;
    const arr = posAttr.array as Float32Array;
    const vel = PARTICLE_DATA.velocities;

    // Animate nodes – gentle drift + orbit
    for (let i = 0; i < NODE_COUNT; i++) {
      const ix = i * 3;
      arr[ix] += vel[ix] + Math.sin(time * 0.15 + i) * 0.001;
      arr[ix + 1] += vel[ix + 1] + Math.cos(time * 0.12 + i) * 0.001;
      arr[ix + 2] += vel[ix + 2];

      // Mouse repulsion
      const dx = arr[ix] - mouseRef.current.x * viewport.width * 0.5;
      const dy = arr[ix + 1] - mouseRef.current.y * viewport.height * 0.5;
      const dSq = dx * dx + dy * dy;
      if (dSq < 9) {
        const force = 0.002 / (dSq + 0.1);
        arr[ix] += dx * force;
        arr[ix + 1] += dy * force;
      }

      // Boundary softening
      const dist = Math.sqrt(arr[ix] ** 2 + arr[ix + 1] ** 2 + arr[ix + 2] ** 2);
      if (dist > 9) {
        arr[ix] *= 0.998;
        arr[ix + 1] *= 0.998;
        arr[ix + 2] *= 0.998;
      }
    }
    posAttr.needsUpdate = true;

    // Rebuild edges dynamically (mutating refs, not useMemo values)
    const linePositions = linePosRef.current;
    const lineColors = lineColRef.current;
    let edgeIdx = 0;
    for (let i = 0; i < NODE_COUNT && edgeIdx < MAX_EDGES; i++) {
      for (let j = i + 1; j < NODE_COUNT && edgeIdx < MAX_EDGES; j++) {
        const dx = arr[i * 3] - arr[j * 3];
        const dy = arr[i * 3 + 1] - arr[j * 3 + 1];
        const dz = arr[i * 3 + 2] - arr[j * 3 + 2];
        const dSq2 = dx * dx + dy * dy + dz * dz;
        if (dSq2 < MAX_DIST_SQ) {
          const alpha = 1 - Math.sqrt(dSq2) / 3.2;
          const pulse = 0.4 + 0.6 * Math.sin(time * 2 + i * 0.1) * alpha;
          const offset = edgeIdx * 6;
          linePositions[offset] = arr[i * 3];
          linePositions[offset + 1] = arr[i * 3 + 1];
          linePositions[offset + 2] = arr[i * 3 + 2];
          linePositions[offset + 3] = arr[j * 3];
          linePositions[offset + 4] = arr[j * 3 + 1];
          linePositions[offset + 5] = arr[j * 3 + 2];
          // Cyan → magenta gradient on edges
          lineColors[offset] = 0;
          lineColors[offset + 1] = 0.94 * pulse;
          lineColors[offset + 2] = 1.0 * pulse;
          lineColors[offset + 3] = 1.0 * pulse;
          lineColors[offset + 4] = 0;
          lineColors[offset + 5] = 0.9 * pulse;
          edgeIdx++;
        }
      }
    }

    const lines = linesRef.current;
    if (lines) {
      const lp = lines.geometry.attributes.position as BufferAttribute;
      const lc = lines.geometry.attributes.color as BufferAttribute;
      (lp.array as Float32Array).set(linePositions);
      (lc.array as Float32Array).set(lineColors);
      lp.needsUpdate = true;
      lc.needsUpdate = true;
      lines.geometry.setDrawRange(0, edgeIdx * 2);
    }
  });

  return (
    <>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[PARTICLE_DATA.positions.slice(), 3]}
            count={NODE_COUNT}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[PARTICLE_DATA.colors, 3]}
            count={NODE_COUNT}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          vertexColors
          transparent
          opacity={0.9}
          sizeAttenuation
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>

      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(MAX_EDGES * 6), 3]}
            count={MAX_EDGES * 2}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[new Float32Array(MAX_EDGES * 6), 3]}
            count={MAX_EDGES * 2}
          />
        </bufferGeometry>
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={0.25}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </lineSegments>
    </>
  );
}

export default function NeuralBackground() {
  // Suppress THREE.Clock deprecation warning triggered by @react-three/fiber internals.
  // R3F v9.5 creates `new THREE.Clock()` which is deprecated in Three.js ≥0.171.
  // This cannot be fixed on our side — only by an R3F update.
  useEffect(() => {
    const origWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      if (typeof args[0] === "string" && args[0].includes("THREE.Clock")) return;
      origWarn.apply(console, args);
    };
    return () => {
      console.warn = origWarn;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ background: "transparent" }}
      >
        <NeuralParticles />
      </Canvas>
    </div>
  );
}
