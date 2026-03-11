"use client";

import { useRef, useEffect, useCallback } from "react";

/* ─────────────────────────────────────────────────
   Particle Field Shader — WebGL2 fragment shader
   Soft glowing orbs drift upward with depth parallax
   Reacts to scroll position for layered movement
   ───────────────────────────────────────────────── */

const VERT = `#version 300 es
precision highp float;
in vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG = `#version 300 es
precision highp float;
out vec4 fragColor;

uniform float u_time;
uniform vec2  u_resolution;
uniform float u_scroll;   // 0..1 normalized scroll
uniform float u_dpr;

// Hash without sin — good for WebGL
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

// Soft circle SDF
float circle(vec2 uv, vec2 center, float radius) {
  float d = length(uv - center);
  return smoothstep(radius, radius * 0.1, d);
}

void main() {
  vec2 uv = gl_FragCoord.xy / (u_resolution * u_dpr);
  float aspect = u_resolution.x / u_resolution.y;
  uv.x *= aspect;

  vec3 col = vec3(0.0);

  // Three depth layers of particles
  for (int layer = 0; layer < 3; layer++) {
    float fl = float(layer);
    float speed  = 0.012 + fl * 0.008;
    float size   = 0.006 - fl * 0.0015;
    float bright = 0.12  - fl * 0.03;
    float scroll_parallax = u_scroll * (0.15 + fl * 0.1);

    for (int i = 0; i < 28; i++) {
      float fi = float(i) + fl * 100.0;
      float px = hash(vec2(fi, fl * 7.3)) * aspect;
      float py = fract(hash(vec2(fi * 1.7, fl * 3.1)) + u_time * speed + scroll_parallax);

      // Gentle x-drift
      px += sin(u_time * 0.3 + fi * 0.5) * 0.02;

      float c = circle(uv, vec2(px, py), size);

      // Color per layer: cyan → purple → fuchsia
      vec3 tint = layer == 0
        ? vec3(0.0, 0.94, 1.0)
        : layer == 1
          ? vec3(0.66, 0.33, 0.97)
          : vec3(1.0, 0.0, 0.9);

      col += tint * c * bright;
    }
  }

  // Vignette
  vec2 vc = gl_FragCoord.xy / (u_resolution * u_dpr) - 0.5;
  float vignette = 1.0 - dot(vc, vc) * 1.4;
  col *= vignette;

  fragColor = vec4(col, 1.0);
}
`;

export default function HowItWorksParticles({
  scrollProgress,
}: {
  scrollProgress: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const rafRef = useRef<number>(0);
  const startTime = useRef(Date.now());
  const scrollRef = useRef(scrollProgress);
  const uniformsRef = useRef<{
    u_time: WebGLUniformLocation | null;
    u_resolution: WebGLUniformLocation | null;
    u_scroll: WebGLUniformLocation | null;
    u_dpr: WebGLUniformLocation | null;
  }>({ u_time: null, u_resolution: null, u_scroll: null, u_dpr: null });
  scrollRef.current = scrollProgress;

  const compile = useCallback((gl: WebGL2RenderingContext, type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn("Shader compile:", gl.getShaderInfoLog(s));
    }
    return s;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
      powerPreference: "low-power",
    });
    if (!gl) return;
    glRef.current = gl;

    // Compile program
    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    programRef.current = prog;

    // Cache uniform locations (avoids string lookup every frame)
    uniformsRef.current = {
      u_time: gl.getUniformLocation(prog, "u_time"),
      u_resolution: gl.getUniformLocation(prog, "u_resolution"),
      u_scroll: gl.getUniformLocation(prog, "u_scroll"),
      u_dpr: gl.getUniformLocation(prog, "u_dpr"),
    };

    // Full-screen quad
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );
    const loc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    // Sizing
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    // Render loop
    const loop = () => {
      gl.useProgram(prog);
      const t = (Date.now() - startTime.current) / 1000;
      const dpr = Math.min(window.devicePixelRatio, 2);
      const u = uniformsRef.current;
      gl.uniform1f(u.u_time, t);
      gl.uniform2f(u.u_resolution, canvas.clientWidth, canvas.clientHeight);
      gl.uniform1f(u.u_scroll, scrollRef.current);
      gl.uniform1f(u.u_dpr, dpr);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      // Cleanup WebGL resources
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, [compile]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ mixBlendMode: "screen", opacity: 0.6 }}
    />
  );
}
