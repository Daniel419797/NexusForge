"use client";

import Link from "next/link";
import { NavItem } from "./nav-items";

interface SidebarProps {
    items: NavItem[];
    pathname: string;
    collapsed: boolean;
    onToggleCollapse: () => void;
    activeProjectName?: string;
}

export default function Sidebar({
    items,
    pathname,
    collapsed,
    onToggleCollapse,
    activeProjectName,
}: SidebarProps) {
    return (
        <aside
            className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-sidebar-border bg-sidebar-gradient transition-all duration-300 ${
                collapsed ? "w-16" : "w-60"
            }`}
        >
            {/* Logo */}
            <div className="h-14 flex items-center px-4 border-b border-sidebar-border">
                <Link href="/projects" className="flex items-center gap-2 overflow-hidden group">
                    <div className="w-8 h-8 shrink-0 rounded-xl bg-primary flex items-center justify-center shadow-lg group-hover:glow-violet transition-all duration-500">
                        <span className="text-sidebar-primary-foreground font-bold text-sm font-mono">R</span>
                    </div>
                    {!collapsed && (
                        <span className="text-lg font-semibold whitespace-nowrap font-display tracking-tight">
                            Re<span className="text-gradient-violet">Use</span>
                        </span>
                    )}
                </Link>
            </div>

            {/* Active project */}
            {!collapsed && activeProjectName && (
                <div className="px-4 py-3 border-b border-sidebar-border">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                        Project
                    </p>
                    <p className="text-sm font-medium truncate">{activeProjectName}</p>
                </div>
            )}

            {/* Nav items */}
            <nav aria-label="Sidebar navigation" className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
                {items.map((item, index) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 animate-in-left ${
                                isActive
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground nav-active-glow"
                                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                            }`}
                            style={{ animationDelay: `${index * 0.04}s` }}
                            title={collapsed ? item.label : undefined}
                        >
                            {item.icon}
                            {!collapsed && <span>{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Sidebar footer */}
            <div className="border-t border-sidebar-border px-2 py-3 space-y-1">
                <button
                    onClick={onToggleCollapse}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground w-full transition-colors duration-200"
                >
                    <svg aria-hidden="true" className={`w-5 h-5 transition-transform duration-300 ${
                            collapsed ? "rotate-180" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
                    </svg>
                    {!collapsed && <span>Collapse</span>}
                </button>
            </div>
        </aside>
    );
}
