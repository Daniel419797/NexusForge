"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import gsap from "gsap";

export default function Hero() {
    const sectionRef = useRef<HTMLElement>(null);
    const headingRef = useRef<HTMLHeadingElement>(null);
    const subRef = useRef<HTMLParagraphElement>(null);
    const ctaRef = useRef<HTMLDivElement>(null);
    const orbRef1 = useRef<HTMLDivElement>(null);
    const orbRef2 = useRef<HTMLDivElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

            // Floating orbs
            gsap.to(orbRef1.current, {
                y: -30,
                x: 15,
                duration: 5,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
            });
            gsap.to(orbRef2.current, {
                y: 20,
                x: -20,
                duration: 7,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
            });

            // Grid background fade in
            tl.fromTo(
                gridRef.current,
                { opacity: 0 },
                { opacity: 0.4, duration: 1.5 }
            );

            // Heading: split words and stagger them
            if (headingRef.current) {
                const words = headingRef.current.querySelectorAll(".hero-word");
                tl.fromTo(
                    words,
                    { y: 80, opacity: 0, rotateX: -20 },
                    { y: 0, opacity: 1, rotateX: 0, duration: 0.8, stagger: 0.08 },
                    "-=1"
                );
            }

            // Subtitle
            tl.fromTo(
                subRef.current,
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.7 },
                "-=0.3"
            );

            // CTA buttons
            tl.fromTo(
                ctaRef.current,
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.6 },
                "-=0.2"
            );
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    const headingText = "Build. Deploy. Scale. Without Limits.";
    const words = headingText.split(" ");

    return (
        <section
            ref={sectionRef}
            className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16"
        >
            {/* Background grid */}
            <div
                ref={gridRef}
                className="absolute inset-0 opacity-0"
                style={{
                    backgroundImage: `
            linear-gradient(hsl(265 90% 67% / 0.04) 1px, transparent 1px),
            linear-gradient(90deg, hsl(265 90% 67% / 0.04) 1px, transparent 1px)
          `,
                    backgroundSize: "60px 60px",
                }}
            />

            {/* Floating gradient orbs */}
            <div
                ref={orbRef1}
                className="absolute top-[15%] left-[10%] w-[500px] h-[500px] rounded-full opacity-20 blur-[120px]"
                style={{
                    background:
                        "radial-gradient(circle, hsl(265 90% 67%) 0%, transparent 70%)",
                }}
            />
            <div
                ref={orbRef2}
                className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full opacity-15 blur-[100px]"
                style={{
                    background:
                        "radial-gradient(circle, hsl(160 72% 50%) 0%, transparent 70%)",
                }}
            />

            {/* Content */}
            <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
                <h1
                    ref={headingRef}
                    className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight mb-6"
                    style={{ perspective: "600px" }}
                >
                    {words.map((word, i) => (
                        <span
                            key={i}
                            className={`hero-word inline-block mr-[0.3em] ${i >= 4 ? "text-gradient-violet" : ""
                                }`}
                        >
                            {word}
                        </span>
                    ))}
                </h1>

                <p
                    ref={subRef}
                    className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed opacity-0"
                >
                    The all-in-one developer platform with built-in authentication, real-time
                    chat, AI intelligence, blockchain tooling, and a plugin marketplace — all
                    managed from a single dashboard.
                </p>

                <div ref={ctaRef} className="flex items-center justify-center gap-4 opacity-0">
                    <Link
                        href="/register"
                        className="inline-flex items-center justify-center px-8 py-3.5 text-sm font-semibold rounded-xl bg-primary text-primary-foreground btn-glow transition-all duration-300 hover:translate-y-[-2px]"
                    >
                        Start Building Free
                        <svg aria-hidden="true" className="ml-2 w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                    </Link>
                    <Link
                        href="#features"
                        className="inline-flex items-center justify-center px-8 py-3.5 text-sm font-semibold rounded-xl border border-border bg-card/50 backdrop-blur-sm hover:bg-card transition-all duration-300 hover:translate-y-[-2px]"
                    >
                        Explore Features
                    </Link>
                </div>

                {/* Stats strip */}
                <div className="mt-20 grid grid-cols-3 gap-8 max-w-lg mx-auto">
                    {[
                        { value: "10+", label: "Modules" },
                        { value: "5", label: "AI Providers" },
                        { value: "∞", label: "Scale" },
                    ].map((stat) => (
                        <div key={stat.label} className="text-center">
                            <div className="text-2xl font-bold text-primary mono">{stat.value}</div>
                            <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
