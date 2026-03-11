"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function CTA() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(
                ".cta-content",
                { y: 40, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.8,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: "top 80%",
                    },
                }
            );
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} className="py-24 relative overflow-hidden">
            {/* Gradient background */}
            <div
                className="absolute inset-0 opacity-30"
                style={{
                    background:
                        "radial-gradient(ellipse at 50% 50%, hsl(265 90% 67% / 0.15), transparent 70%)",
                }}
            />

            <div className="cta-content relative z-10 max-w-3xl mx-auto px-6 text-center opacity-0">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                    Ready to Build Something{" "}
                    <span className="text-gradient-violet">Remarkable</span>?
                </h2>
                <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
                    Join developers who ship faster with pre-built infrastructure. Start
                    with our generous free tier — no credit card required.
                </p>
                <div className="flex items-center justify-center gap-4">
                    <Link
                        href="/register"
                        className="inline-flex items-center px-8 py-3.5 text-sm font-semibold rounded-xl bg-primary text-primary-foreground btn-glow transition-all duration-300 hover:translate-y-[-2px]"
                    >
                        Get Started Free
                        <svg
                            className="ml-2 w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                    </Link>
                    <Link
                        href="#"
                        className="inline-flex items-center px-8 py-3.5 text-sm font-semibold rounded-xl border border-border bg-card/50 backdrop-blur-sm hover:bg-card transition-all duration-300"
                    >
                        View Docs
                    </Link>
                </div>
            </div>
        </section>
    );
}
