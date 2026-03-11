"use client";

import { useRef, useEffect, useCallback } from "react";

/* ─────────────────────────────────────────────
   Dashboard WebGL2 Background Shader
   Subtle data-flow grid with pulsing nodes,
   flowing particles, and mouse-reactive glow.
   Very low intensity — enhances without distracting.
   ───────────────────────────────────────────── */

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
uniform vec2  u_mouse;
uniform float u_dpr;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  vec2 uv = gl_FragCoord.xy / (u_resolution * u_dpr);
  float aspect = u_resolution.x / u_resolution.y;
  vec2 st = vec2(uv.x * aspect, uv.y);

  vec3 col = vec3(0.0);

  // ── Grid lines ──
  float cellSize = 0.07;
  vec2 cell = st / cellSize;
  vec2 gid = floor(cell);
  vec2 gf = fract(cell);

  float lineX = smoothstep(0.02, 0.0, abs(gf.x - 0.5) - 0.48);
  float lineY = smoothstep(0.02, 0.0, abs(gf.y - 0.5) - 0.48);
  float grid = max(lineX, lineY);
  float pulse = 0.4 + 0.6 * sin(u_time * 0.15 + gid.x * 0.4 + gid.y * 0.3);
  col += vec3(0.0, 0.55, 0.62) * grid * 0.02 * pulse;

  // ── Node dots at intersections ──
  float nodeDist = length(gf - 0.5);
  float node = smoothstep(0.1, 0.04, nodeDist);
  float nh = hash(gid);
  float isActive = step(0.72, nh);
  float flicker = 0.3 + 0.7 * sin(u_time * 0.35 + nh * 6.28);
  col += vec3(0.44, 0.22, 0.65) * node * 0.05 * isActive * flicker;

  // ── Data-flow particles ──
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    float speed = 0.08 + hash(vec2(fi, 0.0)) * 0.06;
    float lane = floor(hash(vec2(fi, 1.0)) * 12.0) * cellSize + cellSize * 0.5;
    bool vertical = hash(vec2(fi, 3.0)) > 0.5;
    float pos = fract(u_time * speed + hash(vec2(fi, 2.0)));
    vec2 pPos = vertical ? vec2(lane, pos) : vec2(pos * aspect, lane);
    float pd = length(st - pPos);
    float particle = smoothstep(0.012, 0.004, pd);
    col += vec3(0.0, 0.94, 1.0) * particle * 0.04;
  }

  // ── Mouse proximity glow ──
  vec2 mouse = u_mouse * vec2(aspect, 1.0);
  float mDist = length(st - mouse);
  col += vec3(0.0, 0.85, 1.0) * exp(-mDist * 5.0) * 0.025;

  // ── Vignette ──
  float vig = 1.0 - dot(uv - 0.5, uv - 0.5) * 1.2;
  col *= max(vig, 0.0);

  fragColor = vec4(col, 1.0);
}
`;

export default function DashboardBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const startRef = useRef(Date.now());
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

  const compile = useCallback(
    (gl: WebGL2RenderingContext, type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error(
          `Shader compile error (${type === gl.VERTEX_SHADER ? "VERT" : "FRAG"}):`,
          gl.getShaderInfoLog(s)
        );
        gl.deleteShader(s);
        return null;
      }
      return s;
    },
    []
  );

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

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) {
      console.warn("DashboardBackground: shader compilation failed, skipping WebGL background.");
      if (vs) gl.deleteShader(vs);
      if (fs) gl.deleteShader(fs);
      return;
    }

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(prog));
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      return;
    }

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const u = {
      time: gl.getUniformLocation(prog, "u_time"),
      res: gl.getUniformLocation(prog, "u_resolution"),
      mouse: gl.getUniformLocation(prog, "u_mouse"),
      dpr: gl.getUniformLocation(prog, "u_dpr"),
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 1.5);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const onMouse = (e: PointerEvent) => {
      mouseRef.current.x = e.clientX / window.innerWidth;
      mouseRef.current.y = 1.0 - e.clientY / window.innerHeight;
    };
    window.addEventListener("pointermove", onMouse);

    const loop = () => {
      gl.useProgram(prog);
      const t = (Date.now() - startRef.current) / 1000;
      const dpr = Math.min(window.devicePixelRatio, 1.5);
      gl.uniform1f(u.time, t);
      gl.uniform2f(u.res, canvas.clientWidth, canvas.clientHeight);
      gl.uniform2f(u.mouse, mouseRef.current.x, mouseRef.current.y);
      gl.uniform1f(u.dpr, dpr);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMouse);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, [compile]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
}
