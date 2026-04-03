"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const modules = [
    {
        name: "Auth & Identity",
        tag: "Core",
        description: "Register, login, OAuth, JWT tokens, RBAC.",
        endpoint: "/api/v1/auth",
        color: "hsl(353 72% 53%)",
    },
    {
        name: "Projects",
        tag: "Core",
        description: "Multi-tenant project management, templates, configs.",
        endpoint: "/api/v1/projects",
        color: "hsl(353 60% 45%)",
    },
    {
        name: "Real-time Chat",
        tag: "Communication",
        description: "Rooms, messages, WebSocket gateway, typing indicators.",
        endpoint: "/api/v1/channels",
        color: "hsl(160 72% 50%)",
    },
    {
        name: "Notifications",
        tag: "Communication",
        description: "In-app & push notifications, unread counts, mark-all-read.",
        endpoint: "/api/v1/notifications",
        color: "hsl(160 84% 39%)",
    },
    {
        name: "AI Engine",
        tag: "Intelligence",
        description: "Text gen, chat completion, content & image analysis, agents.",
        endpoint: "/api/v1/ai",
        color: "hsl(25 96% 60%)",
    },
    {
        name: "Blockchain",
        tag: "Web3",
        description: "Wallets, transactions, NFTs, contract events, webhooks.",
        endpoint: "/api/v1/blockchain",
        color: "hsl(320 72% 62%)",
    },
    {
        name: "Plugin Marketplace",
        tag: "Extensibility",
        description: "Browse, install, configure, and submit plugin ideas.",
        endpoint: "/api/v1/plugins",
        color: "hsl(353 72% 65%)",
    },
    {
        name: "x402 Payments",
        tag: "Monetization",
        description: "On-chain payment verification, config & billing.",
        endpoint: "/api/v1/x402",
        color: "hsl(25 96% 55%)",
    },
];

export default function Modules() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(
                ".modules-heading",
                { y: 50, opacity: 0 },
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

            const rows = sectionRef.current?.querySelectorAll(".module-row");
            if (rows) {
                gsap.fromTo(
                    rows,
                    { x: -40, opacity: 0 },
                    {
                        x: 0,
                        opacity: 1,
                        duration: 0.5,
                        stagger: 0.08,
                        ease: "power3.out",
                        scrollTrigger: {
                            trigger: rows[0],
                            start: "top 85%",
                        },
                    }
                );
            }
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} id="modules" className="py-24 bg-card/50">
            <div className="max-w-5xl mx-auto px-6">
                {/* Heading */}
                <div className="modules-heading text-center mb-16 opacity-0">
                    <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary mb-3">
                        Modules
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                        A Module for Every Need
                    </h2>
                    <p className="text-muted-foreground max-w-xl mx-auto">
                        Each module maps directly to a backend API. Enable only what you need — keep your project lean.
                    </p>
                </div>

                {/* Module list */}
                <div className="space-y-3">
                    {modules.map((mod) => (
                        <div
                            key={mod.name}
                            className="module-row flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-all duration-300 group card-hover opacity-0"
                        >
                            <div className="flex items-center gap-4">
                                <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: mod.color }}
                                />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm">{mod.name}</span>
                                        <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                            {mod.tag}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">{mod.description}</p>
                                </div>
                            </div>
                            <code className="hidden sm:block text-xs text-muted-foreground font-mono bg-muted px-3 py-1 rounded-lg group-hover:text-primary transition-colors duration-200">
                                {mod.endpoint}
                            </code>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

