"use client";

import { useRef, useEffect, useState, useCallback, type ReactNode } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ─────────────────────────────────────────────────────────────
   HOW IT WORKS – Apple Vision Pro × Stripe 2026 × Figma Make It
   ─────────────────────────────────────────────────────────────
   • Spatial glass panels floating in layered depth
   • GSAP ScrollTrigger pin + horizontal traverse (desktop)
   • Vertical parallax-stagger on mobile w/ touch inertia
   • WebGL particle field shader background
   • Spring physics micro-interactions on each card
   ──────────────────────────────────────────────────────────── */

// Lazy-load particle shader (SSR-safe)
const ParticlesBg = dynamic(() => import("./HowItWorksParticles"), {
  ssr: false,
});

/* ── Step data ─────────────────────────────────────────────── */
interface Step {
  step: string;
  title: string;
  description: string;
  icon: ReactNode;
  accentHex: string;    // primary glow colour
  accentRgb: string;    // for rgba usage
  gradient: string;     // tailwind gradient stops
}

const steps: Step[] = [
  {
    step: "01",
    title: "Configure with the Wizard",
    description:
      "Open the visual wizard. Define your models, select AI providers, enable blockchain modules, and set auth rules — all through a beautiful spatial UI.",
    icon: (
      <svg aria-hidden="true" className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
      </svg>
    ),
    accentHex: "#00f0ff",
    accentRgb: "0,240,255",
    gradient: "from-cyan-500 to-blue-500",
  },
  {
    step: "02",
    title: "Isolated Project Spin-Up",
    description:
      "Each project gets its own isolated database, API routes, WebSocket namespace, and encryption keys. True multi-tenancy from day one.",
    icon: (
      <svg aria-hidden="true" className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0h.375a2.625 2.625 0 010 5.25H3.375a2.625 2.625 0 010-5.25H3.75" />
      </svg>
    ),
    accentHex: "#a855f7",
    accentRgb: "168,85,247",
    gradient: "from-purple-500 to-fuchsia-500",
  },
  {
    step: "03",
    title: "Add Plugins via GitHub PR",
    description:
      "Need extra functionality? Browse the marketplace or submit your own plugin. Every extension passes security review via GitHub PR workflow.",
    icon: (
      <svg aria-hidden="true" className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
      </svg>
    ),
    accentHex: "#ff00e5",
    accentRgb: "255,0,229",
    gradient: "from-fuchsia-500 to-pink-500",
  },
  {
    step: "04",
    title: "Go Live Instantly",
    description:
      "Your backend is live. Real-time WebSockets, AI endpoints, blockchain APIs, auth, and notifications — all working together immediately.",
    icon: (
      <svg aria-hidden="true" className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.58-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
      </svg>
    ),
    accentHex: "#10b981",
    accentRgb: "16,185,129",
    gradient: "from-emerald-500 to-cyan-500",
  },
];

/* ── Mobile detection hook ─────────────────────────────────── */
function useIsMobile() {
  // Always start false to match SSR — avoids hydration mismatch
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    setMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return mobile;
}

/* ── Spring-physics 3D tilt (pointer-based, desktop only) ── */
function useSpatialTilt(enabled: boolean) {
  const cardRef = useRef<HTMLDivElement>(null);
  const springPos = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const rafId = useRef(0);

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!enabled) return;
      const el = cardRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      springPos.current.targetX =
        ((e.clientX - rect.left) / rect.width - 0.5) * 16;
      springPos.current.targetY =
        ((e.clientY - rect.top) / rect.height - 0.5) * -16;
    },
    [enabled]
  );

  const handlePointerLeave = useCallback(() => {
    springPos.current.targetX = 0;
    springPos.current.targetY = 0;
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const el = cardRef.current;
    if (!el) return;

    el.addEventListener("pointermove", handlePointerMove);
    el.addEventListener("pointerleave", handlePointerLeave);

    // 60fps spring loop — Figma Make It 2026 spring constants
    const stiffness = 0.08;
    const damping = 0.82;
    const tick = () => {
      const s = springPos.current;
      const dx = (s.targetX - s.x) * stiffness;
      const dy = (s.targetY - s.y) * stiffness;
      s.x += dx;
      s.y += dy;
      // Apply damping to velocity (remove residual drift)
      s.x = s.targetX + (s.x - s.targetX) * damping;
      s.y = s.targetY + (s.y - s.targetY) * damping;
      if (el) {
        el.style.transform = `perspective(800px) rotateX(${s.y}deg) rotateY(${s.x}deg) scale3d(1.01,1.01,1.01)`;
      }
      rafId.current = requestAnimationFrame(tick);
    };
    rafId.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId.current);
      el.removeEventListener("pointermove", handlePointerMove);
      el.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [enabled, handlePointerMove, handlePointerLeave]);

  return cardRef;
}

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════ */

export default function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [scrollProg, setScrollProg] = useState(0);

  /* ── GSAP ScrollTrigger — Desktop horizontal traverse ───── */
  useEffect(() => {
    if (isMobile) return;
    const section = sectionRef.current;
    const track = trackRef.current;
    const header = headerRef.current;
    const progress = progressRef.current;
    const orb = orbRef.current;
    if (!section || !track || !header || !progress || !orb) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        header,
        { opacity: 0, y: 60 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "expo.out",
          scrollTrigger: {
            trigger: section,
            start: "top 80%",
            end: "top 40%",
            scrub: 0.6,
          },
        }
      );

      // Horizontal scroll pin
      const cards = track.querySelectorAll<HTMLElement>(".step-card");
      const totalTravel = track.scrollWidth - section.offsetWidth;

      const horizontalTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${totalTravel + window.innerHeight * 0.5}`,
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => setScrollProg(self.progress),
        },
      });

      // Slide track left
      horizontalTl.to(track, {
        x: -totalTravel,
        ease: "none",
      });

      // Progress bar fill synced to scroll
      gsap.to(progress, {
        scaleX: 1,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${totalTravel + window.innerHeight * 0.5}`,
          scrub: 0.5,
        },
      });

      // Floating accent orb parallax
      gsap.to(orb, {
        x: -120,
        y: 80,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom top",
          scrub: 1.2,
        },
      });

      // Stagger card reveals — Figma Make It spring entrance
      cards.forEach((card) => {
        gsap.fromTo(
          card,
          {
            opacity: 0,
            y: 80,
            rotateX: -12,
            scale: 0.92,
          },
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            scale: 1,
            duration: 1.2,
            ease: "expo.out",
            scrollTrigger: {
              trigger: card,
              containerAnimation: horizontalTl,
              start: "left 85%",
              end: "left 40%",
              scrub: 0.4,
            },
          }
        );

        // Inner elements stagger (icon, title, desc) — "spatial float-in"
        const inner = card.querySelectorAll(".card-inner > *");
        gsap.fromTo(
          inner,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            stagger: 0.08,
            duration: 0.8,
            ease: "expo.out",
            scrollTrigger: {
              trigger: card,
              containerAnimation: horizontalTl,
              start: "left 75%",
              end: "left 35%",
              scrub: 0.3,
            },
          }
        );
      });
    }, section);

    return () => ctx.revert();
  }, [isMobile]);

  /* ── GSAP ScrollTrigger — Mobile vertical stagger ────────── */
  useEffect(() => {
    if (!isMobile) return;
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const header = headerRef.current;
      if (header) {
        gsap.fromTo(
          header,
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "expo.out",
            scrollTrigger: {
              trigger: header,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );
      }

      const cards = section.querySelectorAll<HTMLElement>(".step-card");
      cards.forEach((card, i) => {
        // Touch-optimised reveal — no 3D rotation on mobile
        gsap.fromTo(
          card,
          { opacity: 0, y: 60, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.7,
            ease: "expo.out",
            scrollTrigger: {
              trigger: card,
              start: "top 88%",
              toggleActions: "play none none none",
            },
          }
        );

        // Progress dots for mobile
        const dot = section.querySelector(`.progress-dot-${i}`);
        if (dot) {
          gsap.to(dot, {
            scale: 1.4,
            opacity: 1,
            scrollTrigger: {
              trigger: card,
              start: "top 60%",
              end: "bottom 40%",
              scrub: true,
              onLeave: () => gsap.to(dot, { scale: 1, opacity: 0.3 }),
              onLeaveBack: () => gsap.to(dot, { scale: 1, opacity: 0.3 }),
            },
          });
        }
      });
    }, section);

    return () => ctx.revert();
  }, [isMobile]);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden"
      style={{ willChange: "transform" }}
    >
      {/* ── Particle shader background ── */}
      <ParticlesBg scrollProgress={scrollProg} />

      {/* ── Ambient orbs (AVP spatial depth layers) ── */}
      <div
        ref={orbRef}
        className="absolute top-1/4 right-[10%] w-100 h-100 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(0,240,255,0.06) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      <div
        className="absolute bottom-1/4 left-[5%] w-80 h-80 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(168,85,247,0.05) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* ── Spatial grid (AVP environment mesh) ── */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* ── Content wrapper ── */}
      <div className={isMobile ? "py-20 px-5" : "min-h-screen flex flex-col justify-center py-24 px-8"}>
        {/* ── Header ── */}
        <div ref={headerRef} className="max-w-5xl mx-auto text-center mb-12 lg:mb-16">
          {/* Stripe-style pill badge */}
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-mono uppercase tracking-[0.18em] mb-6"
            style={{
              background: "rgba(0,240,255,0.06)",
              border: "1px solid rgba(0,240,255,0.12)",
              color: "rgba(0,240,255,0.8)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            How It Works
          </span>

          <h2 className="text-3xl sm:text-4xl lg:text-[3.25rem] font-extrabold tracking-tight leading-[1.1] mb-4">
            From Zero to{" "}
            <span
              className="text-purple-400"
            >
              Production
            </span>{" "}
            in Minutes
          </h2>

          <p className="text-white/35 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Four spatial steps. Each one builds on the last. Watch your
            backend materialise in real-time.
          </p>

          {/* ── Progress rail (desktop) ── */}
          {!isMobile && (
            <div className="relative h-px max-w-md mx-auto mt-10 overflow-hidden rounded-full bg-white/6">
              <div
                ref={progressRef}
                className="absolute inset-y-0 left-0 w-full origin-left rounded-full"
                style={{
                  transform: "scaleX(0)",
                  background:
                    "linear-gradient(90deg, #00f0ff, #a855f7, #10b981)",
                }}
              />
            </div>
          )}

          {/* ── Progress dots (mobile) ── */}
          {isMobile && (
            <div className="flex items-center justify-center gap-3 mt-8">
              {steps.map((s, i) => (
                <div
                  key={s.step}
                  className={`progress-dot-${i} w-2 h-2 rounded-full opacity-30 transition-all`}
                  style={{ background: s.accentHex }}
                />
              ))}
            </div>
          )}
        </div>

        {/* ─── DESKTOP: Horizontal scroll track ─── */}
        {!isMobile && (
          <div className="overflow-visible">
            <div
              ref={trackRef}
              className="flex gap-8 pl-[max(2rem,calc((100vw-72rem)/2))]"
              style={{ width: "max-content" }}
            >
              {steps.map((step, i) => (
                <DesktopCard key={step.step} step={step} index={i} />
              ))}
              {/* Spacer so last card has room */}
              <div className="shrink-0 w-[20vw]" />
            </div>
          </div>
        )}

        {/* ─── MOBILE: Vertical stack with touch snap ─── */}
        {isMobile && <MobileStack />}
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   DESKTOP CARD — AVP Spatial Glass Panel
   ════════════════════════════════════════════════════════════ */

function DesktopCard({ step, index }: { step: Step; index: number }) {
  const cardRef = useSpatialTilt(true);

  return (
    <div
      className="step-card shrink-0"
      style={{
        width: "clamp(320px, 28vw, 420px)",
        perspective: "1000px",
      }}
    >
      <div
        ref={cardRef}
        className="relative h-full rounded-3xl overflow-hidden transition-shadow duration-500 group"
        style={{
          transformStyle: "preserve-3d",
          willChange: "transform",
          background: `linear-gradient(
            170deg,
            rgba(12,14,30,0.92) 0%,
            rgba(8,10,25,0.85) 100%
          )`,
          border: `1px solid rgba(255,255,255,0.06)`,
          boxShadow: `
            0 0 0 0.5px rgba(255,255,255,0.04),
            0 8px 40px -12px rgba(0,0,0,0.5),
            inset 0 1px 0 rgba(255,255,255,0.06)
          `,
        }}
      >
        {/* ── Top edge highlight (Apple spec light) ── */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent 10%, rgba(${step.accentRgb},0.3) 50%, transparent 90%)`,
          }}
        />

        {/* ── Glow orb behind card (depth layer) ── */}
        <div
          className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700"
          style={{
            background: `radial-gradient(circle, rgba(${step.accentRgb},0.12) 0%, transparent 70%)`,
            filter: "blur(40px)",
          }}
        />

        {/* ── Card inner content ── */}
        <div className="card-inner relative z-10 p-8 flex flex-col h-full min-h-85">
          {/* Step pill */}
          <div>
            <span
              className="inline-flex items-center h-7 px-3 rounded-full text-[10px] font-mono font-semibold uppercase tracking-widest"
              style={{
                color: step.accentHex,
                background: `rgba(${step.accentRgb},0.08)`,
                border: `1px solid rgba(${step.accentRgb},0.15)`,
              }}
            >
              Step {step.step}
            </span>
          </div>

          {/* Icon */}
          <div
            className="mt-6 w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, rgba(${step.accentRgb},0.12) 0%, rgba(${step.accentRgb},0.03) 100%)`,
              border: `1px solid rgba(${step.accentRgb},0.1)`,
              color: step.accentHex,
            }}
          >
            {step.icon}
          </div>

          {/* Title */}
          <h3 className="mt-5 text-xl font-bold text-white/90 tracking-tight leading-snug">
            {step.title}
          </h3>

          {/* Description */}
          <p className="mt-3 text-[13px] text-white/35 leading-[1.7] flex-1">
            {step.description}
          </p>

          {/* Bottom accent bar — Stripe-style gradient line */}
          <div
            className="mt-6 h-px w-full rounded-full opacity-40"
            style={{
              background: `linear-gradient(90deg, ${step.accentHex}, transparent)`,
            }}
          />
        </div>

        {/* ── Connector beam (not on last) ── */}
        {index < 3 && (
          <div
            className="absolute top-1/2 -right-4 w-8 h-px"
            style={{
              background: `linear-gradient(90deg, rgba(${step.accentRgb},0.2), transparent)`,
            }}
          />
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MOBILE — Vertical scroll stack with touch interactions
   ════════════════════════════════════════════════════════════ */

function MobileStack() {
  return (
    <div className="flex flex-col gap-5 max-w-lg mx-auto">
      {steps.map((step, i) => (
        <MobileCard key={step.step} step={step} index={i} />
      ))}
    </div>
  );
}

function MobileCard({ step, index }: { step: Step; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [pressed, setPressed] = useState(false);

  // Touch haptic-like scale on press
  const handleTouchStart = useCallback(() => setPressed(true), []);
  const handleTouchEnd = useCallback(() => setPressed(false), []);

  return (
    <div
      ref={cardRef}
      className="step-card"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div
        className="relative rounded-2xl overflow-hidden transition-transform duration-200 active:scale-[0.98]"
        style={{
          background: `linear-gradient(
            170deg,
            rgba(12,14,30,0.92) 0%,
            rgba(8,10,25,0.88) 100%
          )`,
          border: `1px solid rgba(255,255,255,0.06)`,
          boxShadow: pressed
            ? `0 0 0 1px rgba(${step.accentRgb},0.2), 0 4px 20px -8px rgba(0,0,0,0.4)`
            : `0 4px 24px -8px rgba(0,0,0,0.35)`,
          transform: pressed ? "scale(0.98)" : "scale(1)",
        }}
      >
        {/* Top edge accent */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent 5%, rgba(${step.accentRgb},0.25) 50%, transparent 95%)`,
          }}
        />

        <div className="card-inner p-5 flex gap-4 items-start">
          {/* Icon column */}
          <div className="shrink-0">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, rgba(${step.accentRgb},0.1) 0%, rgba(${step.accentRgb},0.03) 100%)`,
                border: `1px solid rgba(${step.accentRgb},0.1)`,
                color: step.accentHex,
              }}
            >
              {step.icon}
            </div>
            {/* Step number below icon */}
            <span
              className="block text-center text-[9px] font-mono font-bold mt-2 opacity-40"
              style={{ color: step.accentHex }}
            >
              {step.step}
            </span>
          </div>

          {/* Text column */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-white/90 tracking-tight leading-snug">
              {step.title}
            </h3>
            <p className="mt-1.5 text-[12px] text-white/35 leading-[1.65]">
              {step.description}
            </p>
          </div>
        </div>

        {/* Vertical connector (not on last) */}
        {index < 3 && (
          <div className="flex justify-center -mb-5 relative z-10 pb-0.5">
            <div
              className="w-px h-5"
              style={{
                background: `linear-gradient(180deg, rgba(${step.accentRgb},0.2), transparent)`,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
