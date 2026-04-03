"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ScrollReveal from "@/components/Dashboard/ScrollReveal";

export default function AILayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const tabs = [
        { label: "Playground", href: "/ai" },
        { label: "Blockchain Agents", href: "/ai/agents" },
    ];

    return (
        <div>
            <ScrollReveal direction="up">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-white">AI Studio</h1>
                    <p className="text-sm text-white/50 mt-1">
                        Explore AI capabilities and manage your autonomous agents.
                    </p>
                </div>

                <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit mb-6">
                    {tabs.map((tab) => {
                        const isActive = pathname === tab.href;
                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={`px-5 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                                    isActive
                                        ? "bg-white/[0.08] text-white"
                                        : "text-white/50 hover:text-white/70"
                                }`}
                            >
                                {tab.label}
                            </Link>
                        );
                    })}
                </div>
            </ScrollReveal>

            {children}
        </div>
    );
}
