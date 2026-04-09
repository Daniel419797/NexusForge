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

import WizardCTA from "@/components/Dashboard/WizardCTA";
import ActivityFeed from "@/components/Dashboard/ActivityFeed";
import ModelExplorer from "@/components/Dashboard/ModelExplorer";
import PluginGrid from "@/components/Dashboard/PluginGrid";
// Non-core features hidden: BlockchainStatus, X402Panel, AIAssistantOrb

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
                                background: "rgba(220,50,78,0.15)",
                                border: "1px solid rgba(220,50,78,0.25)",
                            }}
                        >
                            + New Project
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* ────── Stat strip ────── */}
            <motion.div
                className="flex divide-x divide-white/[0.06] border border-white/[0.06] rounded-xl overflow-hidden"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
            >
                {([
                    { label: "Total Projects", value: stats?.totalProjects ?? projects.length, color: "text-cyan-400" },
                    { label: "API Requests (24h)", value: stats?.apiRequests24h ?? 0, color: "text-white/70" },
                    { label: "Active Users", value: stats?.activeUsers ?? 0, color: "text-emerald-400" },
                ] as const).map(({ label, value, color }) => (
                    <div key={label} className="flex-1 px-6 py-4">
                        <p className={`text-2xl font-bold tabular-nums ${color}`}>{value.toLocaleString()}</p>
                        <p className="text-xs text-white/30 mt-0.5">{label}</p>
                    </div>
                ))}
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
                <div>
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
                </div>
            </motion.div>

            {/* ────── Plugin Grid ────── */}
            {/* <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.55 }}
            >
                <PluginGrid />
            </motion.div> */}

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
                          background: "rgba(220,50,78,0.10)",
                          border: "1px solid rgba(220,50,78,0.18)",
                      }
                    : { background: "transparent", border: "1px solid transparent" }
            }
        >
            {label}
        </button>
    );
}
