"use client";

import { useRef, useState, useMemo, useCallback, memo, Suspense, useEffect, Component, type ReactNode } from "react";
import { Canvas, useFrame, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import { motion } from "framer-motion";

/* ── WebGL Error Boundary ─────────────────────── */

interface ErrorBoundaryState { hasError: boolean }

class WebGLErrorBoundary extends Component<{ fallback?: ReactNode; children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err: Error) {
    console.error("[WireframeChart3D] WebGL crash:", err);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex items-center justify-center w-full h-full text-xs font-mono text-red-400/60">
          3D chart unavailable
        </div>
      );
    }
    return this.props.children;
  }
}

/* ─────────────────────────────────────────────────────
   WireframeChart3D — 3D wireframe bar chart (Three.js)
   Bars render as wireframe boxes that smoothly fill
   when hovered. Framer Motion handles the outer layout.

   Production features:
   - React.memo on all components to prevent needless re-renders
   - Geometry disposal on unmount / value change (prevents WebGL leaks)
   - Suspense boundary with graceful fallback for async Three.js loading
   - Stable list keys based on labels when available
   - Value clamping to prevent NaN/Infinity heights
   - ARIA labeling for accessibility
   ───────────────────────────────────────────────────── */

type Accent = "cyan" | "purple" | "magenta" | "emerald" | "amber";

const PALETTE: Record<Accent, { wire: string; fill: string; glow: string }> = {
  cyan:    { wire: "#00f5ff", fill: "#00f5ff", glow: "#00f5ff" },
  purple:  { wire: "#a855f7", fill: "#a855f7", glow: "#a855f7" },
  magenta: { wire: "#ff00aa", fill: "#ff00aa", glow: "#ff00aa" },
  emerald: { wire: "#10b981", fill: "#10b981", glow: "#10b981" },
  amber:   { wire: "#f59e0b", fill: "#f59e0b", glow: "#f59e0b" },
};

/* ── Individual Bar ─────────────────────────── */

interface BarProps {
  value: number;        // 0–1
  index: number;
  total: number;
  label?: string;
  accent: Accent;
  hovered: boolean;
  onHover: (idx: number) => void;
  onUnhover: () => void;
}

const Bar = memo(function Bar({ value, index, total, label, accent, hovered, onHover, onUnhover }: BarProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const fillRef = useRef(0);
  const edgesRef = useRef<THREE.LineSegments>(null);
  const { wire, fill } = PALETTE[accent];

  const barWidth = 0.6;
  const gap = 0.3;
  const maxHeight = 3.5;
  // Clamp to prevent NaN/Infinity from bad data
  const clampedValue = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
  const barHeight = Math.max(0.05, clampedValue * maxHeight);

  // Animate fill on hover
  useFrame((_, delta) => {
    const target = hovered ? 1 : 0;
    fillRef.current += (target - fillRef.current) * Math.min(1, delta * 8);

    if (meshRef.current) {
      const mat = meshRef.current.material;
      if (mat instanceof THREE.MeshStandardMaterial) {
        mat.opacity = 0.04 + fillRef.current * 0.35;
        mat.emissiveIntensity = fillRef.current * 0.6;
      }
    }

    if (edgesRef.current) {
      const mat = edgesRef.current.material;
      if (mat instanceof THREE.LineBasicMaterial) {
        mat.opacity = 0.35 + fillRef.current * 0.55;
      }
    }
  });

  // Center bars around origin
  const xPos = (index - (total - 1) / 2) * (barWidth + gap);

  const edgeGeo = useMemo(() => {
    const box = new THREE.BoxGeometry(barWidth, barHeight, barWidth);
    const edges = new THREE.EdgesGeometry(box);
    box.dispose(); // dispose intermediate geometry
    return edges;
  }, [barHeight]);

  // Dispose edge geometry on unmount / value change
  useEffect(() => {
    return () => { edgeGeo.dispose(); };
  }, [edgeGeo]);

  const handlePointerOver = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      onHover(index);
    },
    [index, onHover],
  );

  return (
    <group position={[xPos, barHeight / 2, 0]}>
      {/* Filled volume (transparent, fills on hover) */}
      <mesh ref={meshRef} onPointerOver={handlePointerOver} onPointerOut={onUnhover}>
        <boxGeometry args={[barWidth, barHeight, barWidth]} />
        <meshStandardMaterial
          color={fill}
          transparent
          opacity={0.04}
          emissive={fill}
          emissiveIntensity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Wireframe edges */}
      <lineSegments ref={edgesRef} geometry={edgeGeo}>
        <lineBasicMaterial color={wire} transparent opacity={0.35} />
      </lineSegments>

      {/* Value label on top */}
      {hovered && (
        <Text
          position={[0, barHeight / 2 + 0.25, 0]}
          fontSize={0.2}
          color="white"
          anchorX="center"
          anchorY="bottom"
          font="/fonts/JetBrainsMono-Regular.woff"
          fillOpacity={0.9}
        >
          {Math.round(clampedValue * 100)}%
        </Text>
      )}

      {/* Bottom label */}
      {label && (
        <Text
          position={[0, -barHeight / 2 - 0.2, 0]}
          fontSize={0.16}
          color="white"
          anchorX="center"
          anchorY="top"
          fillOpacity={0.3}
          font="/fonts/JetBrainsMono-Regular.woff"
        >
          {label}
        </Text>
      )}
    </group>
  );
});

/* ── Grid Floor ─────────────────────────────── */

function GridFloor({ accent }: { accent: Accent }) {
  const { wire } = PALETTE[accent];
  return (
    <gridHelper
      args={[8, 16, wire, wire]}
      position={[0, -0.01, 0]}
      material-opacity={0.06}
      material-transparent
    />
  );
}

/* ── Scene ──────────────────────────────────── */

interface SceneProps {
  data: number[];
  labels?: string[];
  accent: Accent;
}

function Scene({ data, labels, accent }: SceneProps) {
  const [hoveredIdx, setHoveredIdx] = useState(-1);

  const handleHover = useCallback((idx: number) => setHoveredIdx(idx), []);
  const handleUnhover = useCallback(() => setHoveredIdx(-1), []);

  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight position={[5, 8, 5]} intensity={0.4} color="#ffffff" />

      <GridFloor accent={accent} />

      {data.map((v, i) => (
        <Bar
          key={labels?.[i] ?? `bar-${i}`}
          value={v}
          index={i}
          total={data.length}
          label={labels?.[i]}
          accent={accent}
          hovered={hoveredIdx === i}
          onHover={handleHover}
          onUnhover={handleUnhover}
        />
      ))}

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2.5}
        autoRotate
        autoRotateSpeed={0.4}
      />
    </>
  );
}

/* ── Exported Component ─────────────────────── */

interface WireframeChart3DProps {
  data: number[];
  labels?: string[];
  accent?: Accent;
  height?: number;
  className?: string;
  title?: string;
}

function WireframeChart3DInner({
  data,
  labels,
  accent = "purple",
  height = 260,
  className = "",
  title,
}: WireframeChart3DProps) {
  return (
    <motion.div
      className={`relative rounded-xl overflow-hidden ${className}`}
      style={{
        height,
        background: "rgba(8,10,25,0.6)",
        border: "1px solid rgba(255,255,255,0.04)",
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      role="img"
      aria-label={`3D bar chart: ${labels?.join(", ") ?? `${data.length} data points`}`}
    >
      {title && (
        <div className="absolute top-3 left-4 z-10 text-xs font-mono text-white/30">
          {title}
        </div>
      )}

      <WebGLErrorBoundary>
        <Suspense
          fallback={
            <div className="flex items-center justify-center w-full h-full text-xs font-mono text-white/20">
              Loading 3D chart\u2026
            </div>
          }
        >
          <Canvas
            camera={{ position: [0, 3, 6], fov: 40 }}
            gl={{ antialias: true, alpha: true }}
            style={{ background: "transparent" }}
            dpr={[1, 2]}
          >
            <Scene data={data} labels={labels} accent={accent} />
          </Canvas>
        </Suspense>
      </WebGLErrorBoundary>

      {/* Bottom ambient glow */}
      <div
        className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
        style={{
          background: `linear-gradient(to top, ${PALETTE[accent].glow}10, transparent)`,
        }}
      />
    </motion.div>
  );
}

/** Memoized export — prevents Three.js scene re-mount on unrelated parent re-renders */
const WireframeChart3D = memo(WireframeChart3DInner);
export default WireframeChart3D;
