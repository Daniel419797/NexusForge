"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import CreateProjectDialog from "@/components/Projects/CreateProjectDialog";
import ProjectService from "@/services/ProjectService";
import DashboardService, { type DashboardStats } from "@/services/DashboardService";
import { useProjectStore } from "@/store/projectStore";

import GlassPanel from "@/components/Dashboard/GlassPanel";
import StatCard from "@/components/Dashboard/StatCard";
import WizardCTA from "@/components/Dashboard/WizardCTA";
import ActivityFeed from "@/components/Dashboard/ActivityFeed";
import ModelExplorer from "@/components/Dashboard/ModelExplorer";
import PluginGrid from "@/components/Dashboard/PluginGrid";
// Non-core features hidden: BlockchainStatus, X402Panel, AIAssistantOrb

/* ── Stagger animation helpers ── */
const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

export default function ProjectsPage() {
    const { projects, setProjects, setActiveProject } = useProjectStore();
    const activeProject = useProjectStore((s) => s.activeProject);
    const [loading, setLoading] = useState(true);
    const [createOpen, setCreateOpen] = useState(false);
    const [selectedTab, setSelectedTab] = useState<"active" | "suspended" | "all">("active");
    const [searchText, setSearchText] = useState("");
    const [stats, setStats] = useState<DashboardStats | null>(null);

    const fetchProjects = useCallback(async () => {
        try {
            const data = await ProjectService.list();
            setProjects(data);
            if (data.length > 0 && !useProjectStore.getState().activeProject) {
                setActiveProject(data[0]);
            }
        } catch {
            // Silently handle
        } finally {
            setLoading(false);
        }
    }, [setProjects, setActiveProject]);

    const fetchStats = useCallback(async () => {
        try {
            const data = await DashboardService.getStats(activeProject?.id);
            setStats(data);
        } catch {
            // Stats are non-critical — fail silently
        }
    }, [activeProject?.id]);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const activeCount = projects.filter((p) => p.status === "active").length;

    return (
        <div className="space-y-6">
            {/* ────── Hero header ────── */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">
                            Dashboard
                        </h1>
                        <p className="mt-1 text-sm text-white/35">
                            Your NexusForge command center — manage projects, models, plugins & more.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Input
                            placeholder="Search projects..."
                            className="w-full sm:w-64 bg-white/[0.03] border-white/[0.06] text-white/80 placeholder:text-white/20"
                            value={searchText}
                            onChange={(e: any) => setSearchText(e.target.value)}
                        />
                        <Button
                            onClick={() => setCreateOpen(true)}
                            className="shrink-0 text-sm font-semibold"
                            style={{
                                background: "linear-gradient(135deg, rgba(168,85,247,0.35), rgba(0,245,255,0.25))",
                                border: "1px solid rgba(168,85,247,0.25)",
                            }}
                        >
                            + New Project
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* ────── Stat cards row ────── */}
            <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                variants={stagger}
                initial="hidden"
                animate="show"
            >
                <motion.div variants={fadeUp}>
                    <StatCard
                        label="Total Projects"
                        value={stats?.totalProjects ?? projects.length}
                        accent="cyan"
                        trend="up"
                        trendLabel={`${projects.length}`}
                        icon={
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(0,245,255,0.7)" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                            </svg>
                        }
                    />
                </motion.div>
                <motion.div variants={fadeUp}>
                    <StatCard
                        label="API Requests (24h)"
                        value={stats?.apiRequests24h ?? 0}
                        accent="purple"
                        trend="up"
                        trendLabel="24h"
                        icon={
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(168,85,247,0.7)" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                            </svg>
                        }
                    />
                </motion.div>
                <motion.div variants={fadeUp}>
                    <StatCard
                        label="Active Users"
                        value={stats?.activeUsers ?? 0}
                        accent="emerald"
                        trend="up"
                        trendLabel="24h"
                        icon={
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(16,185,129,0.7)" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                            </svg>
                        }
                    />
                </motion.div>
            </motion.div>

            {/* ────── Wizard CTA ────── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35 }}
            >
                <WizardCTA onOpenWizard={() => setCreateOpen(true)} />
            </motion.div>

            {/* ────── Activity Feed + Model Explorer ────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <motion.div
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    <ActivityFeed />
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.45 }}
                >
                    <ModelExplorer />
                </motion.div>
            </div>

            {/* ────── Project listing ────── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
            >
                <GlassPanel accent="cyan" hover3d={false}>
                    {/* Tabs */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <TabButton
                                label={`Active (${activeCount})`}
                                active={selectedTab === "active"}
                                onClick={() => setSelectedTab("active")}
                            />
                            <TabButton
                                label={`Suspended (${projects.length - activeCount})`}
                                active={selectedTab === "suspended"}
                                onClick={() => setSelectedTab("suspended")}
                            />
                            <TabButton
                                label={`All (${projects.length})`}
                                active={selectedTab === "all"}
                                onClick={() => setSelectedTab("all")}
                            />
                        </div>
                        <h3 className="text-sm font-semibold text-white/80 tracking-wide uppercase">
                            Projects
                        </h3>
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="space-y-3 py-4">
                            {[1, 2, 3].map((n) => (
                                <Skeleton key={n} className="h-10 w-full rounded-lg bg-white/[0.03]" />
                            ))}
                        </div>
                    ) : (
                        <>
                            <div className="hidden md:flex text-[10px] uppercase tracking-wider text-white/20 font-medium px-4 py-2 border-b border-white/[0.04]">
                                <div className="w-1/2">Project Name</div>
                                <div className="w-1/6">Status</div>
                                <div className="w-1/6">Category</div>
                                <div className="w-1/6">Updated</div>
                            </div>
                            <div>
                                {projects
                                    .filter((p) => {
                                        if (selectedTab === "active" && p.status !== "active") return false;
                                        if (selectedTab === "suspended" && p.status === "active") return false;
                                        if (!searchText) return true;
                                        const q = searchText.toLowerCase();
                                        return (
                                            p.name.toLowerCase().includes(q) ||
                                            (p.category || "").toLowerCase().includes(q) ||
                                            p.id.includes(q)
                                        );
                                    })
                                    .map((project, index) => (
                                        <motion.div
                                            key={project.id}
                                            className="flex flex-col md:flex-row md:items-center px-4 py-3 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors gap-1.5 md:gap-0"
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3, delay: index * 0.04 }}
                                        >
                                            <div className="md:w-1/2 flex items-center justify-between">
                                                <Link
                                                    href={`/projects/${project.id}`}
                                                    className="text-sm font-medium text-white/75 hover:text-white transition-colors"
                                                    onClick={() => setActiveProject(project)}
                                                >
                                                    {project.name}
                                                </Link>
                                                {/* Mobile-only kebab menu */}
                                                <div className="md:hidden">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <button className="p-1.5 rounded-lg text-white/25 hover:text-white/50 hover:bg-white/[0.04] transition-colors">
                                                                <MoreHorizontal className="size-4" />
                                                            </button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent>
                                                            <DropdownMenuItem onSelect={() => setActiveProject(project)}>Open</DropdownMenuItem>
                                                            <DropdownMenuItem onSelect={() => {}}>Settings</DropdownMenuItem>
                                                            <DropdownMenuItem onSelect={async () => { if (!confirm("Delete project? This cannot be undone.")) return; try { await ProjectService.delete(project.id); fetchProjects(); } catch {} }}>Delete</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                            {/* Mobile meta row */}
                                            <div className="flex items-center gap-3 md:contents text-xs">
                                                <div className="md:w-1/6">
                                                    {project.status === "active" ? (
                                                        <span className="flex items-center gap-1.5">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                                            <span className="text-emerald-400/70">Active</span>
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1.5">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                                                            <span className="text-rose-400/70">Suspended</span>
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="md:w-1/6 text-white/30">
                                                    {project.category}
                                                </div>
                                                <div className="md:w-1/6 text-white/25 font-mono">
                                                    {new Date(project.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div className="ml-3 hidden md:block">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button className="p-1.5 rounded-lg text-white/25 hover:text-white/50 hover:bg-white/[0.04] transition-colors">
                                                            <MoreHorizontal className="size-4" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent>
                                                        <DropdownMenuItem onSelect={() => setActiveProject(project)}>
                                                            Open
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={() => {}}>
                                                            Settings
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onSelect={async () => {
                                                                if (!confirm("Delete project? This cannot be undone.")) return;
                                                                try {
                                                                    await ProjectService.delete(project.id);
                                                                    fetchProjects();
                                                                } catch {
                                                                    // ignore
                                                                }
                                                            }}
                                                        >
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </motion.div>
                                    ))}
                                {projects.length === 0 && !loading && (
                                    <div className="py-12 text-center">
                                        <p className="text-sm text-white/25">No projects yet. Create your first one!</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </GlassPanel>
            </motion.div>

            {/* ────── Plugin Grid ────── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.55 }}
            >
                <PluginGrid />
            </motion.div>

            {/* Non-core features hidden: Blockchain, X402, AI Assistant */}

            {/* ────── Create project dialog ────── */}
            <CreateProjectDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                onCreated={fetchProjects}
            />
        </div>
    );
}

function TabButton({
    label,
    active,
    onClick,
}: {
    label: string;
    active?: boolean;
    onClick?: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                active
                    ? "text-white/80"
                    : "text-white/30 hover:text-white/50 hover:bg-white/[0.03]"
            }`}
            style={
                active
                    ? {
                          background: "rgba(168,85,247,0.12)",
                          border: "1px solid rgba(168,85,247,0.15)",
                      }
                    : { background: "transparent", border: "1px solid transparent" }
            }
        >
            {label}
        </button>
    );
}
