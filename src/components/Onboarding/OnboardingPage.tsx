"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useOnboardingStore } from "@/store/onboardingStore";
import { useProjectStore } from "@/store/projectStore";
import ProjectService from "@/services/ProjectService";
import type { CategoryTemplate } from "@/services/ProjectService";
import {
    CheckCircle2,
    Loader2,
    ArrowRight,
    ArrowLeft,
    Rocket,
    Sparkles,
    Database,
    FolderPlus,
    Copy,
    Check,
} from "lucide-react";

/* ── Available modules for the picker ── */
const AVAILABLE_MODULES = [
    { id: "auth", label: "Authentication", description: "User sign-up, login, JWT, OAuth", icon: "🔐" },
    { id: "database", label: "Database", description: "CRUD, migrations, schema management", icon: "🗄️" },
    { id: "storage", label: "File Storage", description: "Upload, serve, and manage files", icon: "📁" },
    { id: "realtime", label: "Realtime", description: "WebSocket subscriptions & live queries", icon: "⚡" },
    { id: "push", label: "Push Notifications", description: "Mobile & web push via FCM/APNs", icon: "🔔" },
    { id: "functions", label: "Edge Functions", description: "Serverless functions at the edge", icon: "λ" },
];

/* ── DB type options ── */
const DB_TYPES = [
    { id: "postgres", label: "PostgreSQL", description: "Best for structured data, SQL, full ACID compliance" },
    { id: "mysql", label: "MySQL", description: "Popular relational DB, great ecosystem support" },
    { id: "sqlite", label: "SQLite", description: "Lightweight, zero-config, perfect for prototyping" },
];

/* ── Step indicators ── */
const STEP_META = [
    { label: "Create Project", icon: FolderPlus },
    { label: "Pick Modules", icon: Sparkles },
    { label: "Configure DB", icon: Database },
    { label: "Launch", icon: Rocket },
];

/* ── Animation variants ── */
const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

export default function OnboardingPage() {
    const router = useRouter();
    const {
        step, projectName, category, enabledModules, dbType,
        createdProjectId, projectToken,
        setStep, nextStep, prevStep,
        setProjectName, setCategory, toggleModule, setDbType,
        setCreatedProject, markCompleted, completed,
    } = useOnboardingStore();

    const { templates, fetchTemplates, setActiveProject } = useProjectStore();
    const [direction, setDirection] = useState(1);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Redirect if already completed onboarding
    useEffect(() => {
        if (completed) {
            router.replace("/projects");
        }
    }, [completed, router]);

    // Fetch templates on mount
    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    // Pre-select suggested modules when a category template is chosen
    useEffect(() => {
        if (category && templates.length > 0) {
            const tpl = templates.find((t) => t.category === category);
            if (tpl?.suggestedPlugins) {
                // Only auto-select if user hasn't manually modified yet
                const store = useOnboardingStore.getState();
                if (store.enabledModules.length === 0) {
                    tpl.suggestedPlugins.forEach((p) => {
                        if (!store.enabledModules.includes(p)) {
                            useOnboardingStore.getState().toggleModule(p);
                        }
                    });
                }
            }
        }
    }, [category, templates]);

    const goNext = useCallback(() => { setDirection(1); nextStep(); }, [nextStep]);
    const goPrev = useCallback(() => { setDirection(-1); prevStep(); }, [prevStep]);

    const handleCreateProject = async () => {
        if (!projectName.trim() || !category) {
            setError("Please enter a project name and select a template.");
            return;
        }
        setCreating(true);
        setError(null);
        try {
            const result = await ProjectService.create({
                name: projectName.trim(),
                category,
                enabledModules: enabledModules.length > 0 ? enabledModules : undefined,
                config: { dbType },
            });
            setCreatedProject(result.project.id, result.projectToken);
            setActiveProject(result.project);
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            setError(axiosErr.response?.data?.message || "Failed to create project.");
        } finally {
            setCreating(false);
        }
    };

    const handleFinish = () => {
        markCompleted();
        if (createdProjectId) {
            router.push(`/projects/${createdProjectId}`);
        } else {
            router.push("/projects");
        }
    };

    const handleCopyToken = () => {
        if (projectToken) {
            navigator.clipboard.writeText(projectToken);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Step validation
    const canProceed = () => {
        switch (step) {
            case 0: return projectName.trim().length > 0 && category.length > 0;
            case 1: return true; // modules are optional
            case 2: return dbType.length > 0;
            case 3: return true;
            default: return false;
        }
    };

    if (completed) return null;

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-8">
            {/* ── Header ── */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center mb-8"
            >
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">
                    Welcome to NexusForge
                </h1>
                <p className="text-white/40 text-sm sm:text-base">
                    Let&apos;s set up your first project in under 2 minutes.
                </p>
            </motion.div>

            {/* ── Step indicator ── */}
            <div className="flex items-center gap-2 mb-8">
                {STEP_META.map((meta, i) => {
                    const Icon = meta.icon;
                    const isActive = i === step;
                    const isDone = i < step;
                    return (
                        <button
                            key={meta.label}
                            onClick={() => { setDirection(i > step ? 1 : -1); setStep(i); }}
                            className={`
                                flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium
                                transition-all duration-300 cursor-pointer
                                ${isActive
                                    ? "bg-primary/15 border border-primary/30 text-white"
                                    : isDone
                                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400/70"
                                        : "bg-white/[0.03] border border-white/[0.06] text-white/25"
                                }
                            `}
                        >
                            {isDone ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                                <Icon className="w-3.5 h-3.5" />
                            )}
                            <span className="hidden sm:inline">{meta.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* ── Step content ── */}
            <div className="w-full max-w-2xl">
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={step}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                        {step === 0 && (
                            <StepCreateProject
                                projectName={projectName}
                                category={category}
                                templates={templates}
                                onNameChange={setProjectName}
                                onCategoryChange={setCategory}
                            />
                        )}
                        {step === 1 && (
                            <StepPickModules
                                enabledModules={enabledModules}
                                onToggle={toggleModule}
                            />
                        )}
                        {step === 2 && (
                            <StepConfigureDB
                                dbType={dbType}
                                onDbTypeChange={setDbType}
                            />
                        )}
                        {step === 3 && (
                            <StepLaunch
                                projectName={projectName}
                                category={category}
                                enabledModules={enabledModules}
                                dbType={dbType}
                                projectToken={projectToken}
                                createdProjectId={createdProjectId}
                                creating={creating}
                                error={error}
                                copied={copied}
                                onCreateProject={handleCreateProject}
                                onCopyToken={handleCopyToken}
                                onFinish={handleFinish}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* ── Navigation buttons ── */}
            <div className="flex items-center gap-3 mt-8">
                {step > 0 && (
                    <Button
                        variant="outline"
                        onClick={goPrev}
                        className="gap-2 border-white/10 text-white/60 hover:text-white hover:border-white/20"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </Button>
                )}
                {step < 3 && (
                    <Button
                        onClick={goNext}
                        disabled={!canProceed()}
                        className="gap-2"
                        style={{
                            background: "linear-gradient(135deg, rgba(168,85,247,0.35), rgba(0,245,255,0.25))",
                            border: "1px solid rgba(168,85,247,0.25)",
                        }}
                    >
                        Continue
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                )}
            </div>

            {/* ── Skip link ── */}
            <button
                onClick={handleFinish}
                className="mt-4 text-xs text-white/20 hover:text-white/40 transition-colors underline underline-offset-2"
            >
                Skip onboarding
            </button>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Step 1 — Create Project
   ═══════════════════════════════════════════════════════════════════════════ */
function StepCreateProject({
    projectName,
    category,
    templates,
    onNameChange,
    onCategoryChange,
}: {
    projectName: string;
    category: string;
    templates: CategoryTemplate[];
    onNameChange: (name: string) => void;
    onCategoryChange: (category: string) => void;
}) {
    return (
        <div className="space-y-6">
            <div className="text-center mb-2">
                <h2 className="text-xl font-semibold text-white/90">Name your project</h2>
                <p className="text-sm text-white/35 mt-1">Pick a name and a template to pre-configure your backend.</p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="onboard-name" className="text-white/60">Project Name</Label>
                <Input
                    id="onboard-name"
                    placeholder="My Awesome App"
                    value={projectName}
                    onChange={(e) => onNameChange(e.target.value)}
                    className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20"
                    autoFocus
                />
            </div>

            <div className="space-y-3">
                <Label className="text-white/60">Choose a Template</Label>
                {templates.length === 0 ? (
                    <div className="flex justify-center items-center py-10 text-white/30 bg-white/[0.02] rounded-xl border border-white/[0.05]">
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Loading templates...
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[40vh] overflow-y-auto pr-1">
                        {templates.map((tpl) => (
                            <button
                                key={tpl.category}
                                type="button"
                                onClick={() => onCategoryChange(tpl.category)}
                                className={`
                                    relative p-4 rounded-xl border text-left transition-all duration-200
                                    hover:border-primary/40 hover:bg-primary/5
                                    ${category === tpl.category
                                        ? "border-primary/50 ring-1 ring-primary/30 bg-primary/10"
                                        : "border-white/[0.06] bg-white/[0.02]"
                                    }
                                `}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-medium text-sm text-white/80">{tpl.name}</h4>
                                    {category === tpl.category && (
                                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                                    )}
                                </div>
                                <p className="text-xs text-white/35 leading-relaxed">{tpl.description}</p>
                                {tpl.suggestedPlugins?.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {tpl.suggestedPlugins.slice(0, 3).map((p) => (
                                            <span key={p} className="inline-block px-1.5 py-0.5 rounded text-[9px] bg-white/[0.05] text-white/30">
                                                {p}
                                            </span>
                                        ))}
                                        {tpl.suggestedPlugins.length > 3 && (
                                            <span className="inline-block px-1.5 py-0.5 rounded text-[9px] bg-white/[0.05] text-white/30">
                                                +{tpl.suggestedPlugins.length - 3}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Step 2 — Pick Modules
   ═══════════════════════════════════════════════════════════════════════════ */
function StepPickModules({
    enabledModules,
    onToggle,
}: {
    enabledModules: string[];
    onToggle: (module: string) => void;
}) {
    return (
        <div className="space-y-6">
            <div className="text-center mb-2">
                <h2 className="text-xl font-semibold text-white/90">Pick your modules</h2>
                <p className="text-sm text-white/35 mt-1">Enable the backend capabilities you need. You can always change these later.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {AVAILABLE_MODULES.map((mod) => {
                    const selected = enabledModules.includes(mod.id);
                    return (
                        <button
                            key={mod.id}
                            type="button"
                            onClick={() => onToggle(mod.id)}
                            className={`
                                flex items-start gap-3 p-4 rounded-xl border text-left transition-all duration-200
                                hover:border-primary/40
                                ${selected
                                    ? "border-primary/50 bg-primary/10 ring-1 ring-primary/20"
                                    : "border-white/[0.06] bg-white/[0.02]"
                                }
                            `}
                        >
                            <span className="text-2xl shrink-0 mt-0.5">{mod.icon}</span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-medium text-sm text-white/80">{mod.label}</h4>
                                    {selected && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                                </div>
                                <p className="text-xs text-white/35 mt-0.5">{mod.description}</p>
                            </div>
                        </button>
                    );
                })}
            </div>

            {enabledModules.length > 0 && (
                <p className="text-center text-xs text-white/25">
                    {enabledModules.length} module{enabledModules.length !== 1 ? "s" : ""} selected
                </p>
            )}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Step 3 — Configure DB
   ═══════════════════════════════════════════════════════════════════════════ */
function StepConfigureDB({
    dbType,
    onDbTypeChange,
}: {
    dbType: string;
    onDbTypeChange: (dbType: string) => void;
}) {
    return (
        <div className="space-y-6">
            <div className="text-center mb-2">
                <h2 className="text-xl font-semibold text-white/90">Choose your database</h2>
                <p className="text-sm text-white/35 mt-1">We&apos;ll provision a fully-managed database for your project.</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {DB_TYPES.map((db) => {
                    const selected = dbType === db.id;
                    return (
                        <button
                            key={db.id}
                            type="button"
                            onClick={() => onDbTypeChange(db.id)}
                            className={`
                                flex items-center gap-4 p-5 rounded-xl border text-left transition-all duration-200
                                hover:border-primary/40
                                ${selected
                                    ? "border-primary/50 bg-primary/10 ring-1 ring-primary/20"
                                    : "border-white/[0.06] bg-white/[0.02]"
                                }
                            `}
                        >
                            <Database className={`w-6 h-6 shrink-0 ${selected ? "text-primary" : "text-white/25"}`} />
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-medium text-sm text-white/80">{db.label}</h4>
                                    {selected && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                                </div>
                                <p className="text-xs text-white/35 mt-0.5">{db.description}</p>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Step 4 — Launch / Summary
   ═══════════════════════════════════════════════════════════════════════════ */
function StepLaunch({
    projectName,
    category,
    enabledModules,
    dbType,
    projectToken,
    createdProjectId,
    creating,
    error,
    copied,
    onCreateProject,
    onCopyToken,
    onFinish,
}: {
    projectName: string;
    category: string;
    enabledModules: string[];
    dbType: string;
    projectToken: string | null;
    createdProjectId: string | null;
    creating: boolean;
    error: string | null;
    copied: boolean;
    onCreateProject: () => void;
    onCopyToken: () => void;
    onFinish: () => void;
}) {
    const isCreated = !!createdProjectId;

    return (
        <div className="space-y-6">
            <div className="text-center mb-2">
                <h2 className="text-xl font-semibold text-white/90">
                    {isCreated ? "You're all set!" : "Review & Launch"}
                </h2>
                <p className="text-sm text-white/35 mt-1">
                    {isCreated
                        ? "Your project is ready. Save your API token below."
                        : "Double-check your configuration and create your project."
                    }
                </p>
            </div>

            {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* Summary card */}
            <Card className="border-white/[0.08] bg-white/[0.03]">
                <CardContent className="p-5 space-y-3">
                    <SummaryRow label="Project" value={projectName} />
                    <SummaryRow label="Template" value={category} />
                    <SummaryRow
                        label="Modules"
                        value={enabledModules.length > 0 ? enabledModules.join(", ") : "None selected"}
                    />
                    <SummaryRow label="Database" value={dbType} />
                </CardContent>
            </Card>

            {/* Token reveal */}
            {isCreated && projectToken && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Card className="border-primary/20 bg-primary/5">
                        <CardContent className="p-5">
                            <p className="text-sm font-medium text-primary mb-2">
                                🔐 Project API Token — save this securely
                            </p>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 p-2.5 rounded-lg bg-black/30 border border-white/[0.08] text-xs font-mono text-white/70 break-all">
                                    {projectToken}
                                </code>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onCopyToken}
                                    className="shrink-0 gap-1.5 border-white/10 text-white/60"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                    {copied ? "Copied" : "Copy"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Action buttons */}
            <div className="flex justify-center gap-3">
                {!isCreated ? (
                    <Button
                        onClick={onCreateProject}
                        disabled={creating}
                        className="gap-2 px-6"
                        style={{
                            background: "linear-gradient(135deg, rgba(168,85,247,0.4), rgba(0,245,255,0.3))",
                            border: "1px solid rgba(168,85,247,0.3)",
                        }}
                    >
                        {creating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Rocket className="w-4 h-4" />
                                Create Project
                            </>
                        )}
                    </Button>
                ) : (
                    <Button
                        onClick={onFinish}
                        className="gap-2 px-6"
                        style={{
                            background: "linear-gradient(135deg, rgba(16,185,129,0.35), rgba(0,245,255,0.25))",
                            border: "1px solid rgba(16,185,129,0.25)",
                        }}
                    >
                        <ArrowRight className="w-4 h-4" />
                        Go to Dashboard
                    </Button>
                )}
            </div>
        </div>
    );
}

/* ── Tiny helper for summary rows ── */
function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between text-sm">
            <span className="text-white/35">{label}</span>
            <span className="text-white/70 font-medium capitalize">{value}</span>
        </div>
    );
}
