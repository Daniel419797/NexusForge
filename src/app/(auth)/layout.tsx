"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import gsap from "gsap";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const orbRef1 = useRef<HTMLDivElement>(null);
    const orbRef2 = useRef<HTMLDivElement>(null);
    const orbRef3 = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.to(orbRef1.current, {
                y: -30,
                x: 25,
                scale: 1.05,
                duration: 7,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
            });
            gsap.to(orbRef2.current, {
                y: 20,
                x: -20,
                scale: 0.95,
                duration: 9,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
            });
            gsap.to(orbRef3.current, {
                y: -15,
                x: -10,
                scale: 1.08,
                duration: 11,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
            });
        });
        return () => ctx.revert();
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
            {/* Grid pattern */}
            <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />

            {/* Atmospheric orbs — violet, emerald, ember */}
            <div
                ref={orbRef1}
                className="absolute top-[15%] left-[10%] w-[500px] h-[500px] rounded-full pointer-events-none"
                style={{
                    background:
                        "radial-gradient(circle, hsl(265 90% 67% / 0.12) 0%, transparent 70%)",
                }}
            />
            <div
                ref={orbRef2}
                className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] rounded-full pointer-events-none"
                style={{
                    background:
                        "radial-gradient(circle, hsl(160 72% 50% / 0.08) 0%, transparent 70%)",
                }}
            />
            <div
                ref={orbRef3}
                className="absolute top-[50%] right-[30%] w-[300px] h-[300px] rounded-full pointer-events-none"
                style={{
                    background:
                        "radial-gradient(circle, hsl(25 96% 60% / 0.06) 0%, transparent 70%)",
                }}
            />

            {/* Giant watermark */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-watermark font-display select-none">
                NexusForge
            </div>

            {/* Content */}
            <div className="relative z-10 w-full max-w-md px-6">
                {/* Logo */}
                <div className="flex justify-center mb-10 animate-in-up">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg group-hover:glow-violet transition-all duration-500">
                            <span className="text-primary-foreground font-bold text-base font-mono">R</span>
                        </div>
                        <span className="text-2xl font-display font-bold tracking-tight">
                            <span className="text-gradient-violet">Nexus</span>Forge
                        </span>
                    </Link>
                </div>

                {/* Form card with gradient border */}
                <div className="bg-card/80 border border-border/50 rounded-2xl p-8 backdrop-blur-xl animate-in-up stagger-2 card-hover">
                    {children}
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-muted-foreground mt-8 animate-in-fade stagger-4">
                    © {new Date().getFullYear()} NexusForge. Infrastructure for builders.
                </p>
            </div>
        </div>
    );
}
