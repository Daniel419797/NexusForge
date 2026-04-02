"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const { isAuthenticated } = useAuthStore();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
                    ? "bg-background/80 backdrop-blur-xl border-b border-border shadow-lg"
                    : "bg-transparent"
                }`}
        >
            <nav aria-label="Main navigation" className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center group-hover:glow-violet transition-shadow duration-300">
                        <span className="text-primary-foreground font-bold text-sm font-mono">R</span>
                    </div>
                    <span className="text-xl font-semibold tracking-tight">
                        Re<span className="text-primary">Use</span>
                    </span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-8">
                    <Link
                        href="#features"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                    >
                        Features
                    </Link>
                    <Link
                        href="#modules"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                    >
                        Modules
                    </Link>
                    <Link
                        href="#pricing"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                    >
                        Pricing
                    </Link>
                    {isAuthenticated ? (
                        <Link
                            href="/projects"
                            className="inline-flex items-center justify-center px-5 py-2 text-sm font-medium rounded-xl bg-primary text-primary-foreground btn-glow transition-all duration-200"
                        >
                            Dashboard
                        </Link>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                            >
                                Sign In
                            </Link>
                            <Link
                                href="/register"
                                className="inline-flex items-center justify-center px-5 py-2 text-sm font-medium rounded-xl bg-primary text-primary-foreground btn-glow transition-all duration-200"
                            >
                                Get Started
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Hamburger */}
                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="md:hidden flex flex-col gap-1.5 p-2"
                    aria-label="Toggle menu"
                >
                    <span
                        className={`w-5 h-0.5 bg-foreground transition-transform duration-200 ${mobileOpen ? "rotate-45 translate-y-2" : ""
                            }`}
                    />
                    <span
                        className={`w-5 h-0.5 bg-foreground transition-opacity duration-200 ${mobileOpen ? "opacity-0" : ""
                            }`}
                    />
                    <span
                        className={`w-5 h-0.5 bg-foreground transition-transform duration-200 ${mobileOpen ? "-rotate-45 -translate-y-2" : ""
                            }`}
                    />
                </button>
            </nav>

            {/* Mobile Menu */}
            {mobileOpen && (
                <div className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border px-6 py-4 space-y-3">
                    <Link href="#features" className="block text-sm text-muted-foreground hover:text-foreground">
                        Features
                    </Link>
                    <Link href="#modules" className="block text-sm text-muted-foreground hover:text-foreground">
                        Modules
                    </Link>
                    <Link href="#pricing" className="block text-sm text-muted-foreground hover:text-foreground">
                        Pricing
                    </Link>
                    {isAuthenticated ? (
                        <Link
                            href="/projects"
                            className="block w-full text-center px-5 py-2 text-sm font-medium rounded-xl bg-primary text-primary-foreground btn-glow"
                        >
                            Dashboard
                        </Link>
                    ) : (
                        <>
                            <Link href="/login" className="block text-sm text-muted-foreground hover:text-foreground">
                                Sign In
                            </Link>
                            <Link
                                href="/register"
                                className="block w-full text-center px-5 py-2 text-sm font-medium rounded-xl bg-primary text-primary-foreground btn-glow"
                            >
                                Get Started
                            </Link>
                        </>
                    )}
                </div>
            )}
        </header>
    );
}
