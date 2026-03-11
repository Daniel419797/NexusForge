"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface ProjectCardProps {
    project: {
        id: string;
        name: string;
        category: string;
        status: string;
        createdAt: string;
    };
}

const categoryColors: Record<string, string> = {
    "web-app": "bg-teal/10 text-teal border-teal/20",
    "mobile-app": "bg-blue-500/10 text-blue-400 border-blue-500/20",
    "api-service": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "e-commerce": "bg-amber-500/10 text-amber-400 border-amber-500/20",
    saas: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    "blockchain-dapp": "bg-rose-500/10 text-rose-400 border-rose-500/20",
    "ai-ml": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    iot: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

export default function ProjectCard({ project }: ProjectCardProps) {
    const colorClass =
        categoryColors[project.category] ||
        "bg-muted text-muted-foreground border-border";

    return (
        <Link
            href={`/projects/${project.id}`}
            className="group block p-5 rounded-xl border border-border bg-card hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
        >
            <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-lg group-hover:bg-primary/20 transition-colors duration-300">
                    {project.name.charAt(0).toUpperCase()}
                </div>
                <Badge
                    variant="outline"
                    className={`text-[10px] uppercase tracking-wider ${colorClass}`}
                >
                    {project.category.replace("-", " ")}
                </Badge>
            </div>

            <h3 className="font-semibold text-base mb-1 group-hover:text-primary transition-colors duration-200">
                {project.name}
            </h3>

            <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-muted-foreground">
                    {new Date(project.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                    })}
                </span>
                <span
                    className={`inline-flex items-center gap-1 text-xs ${project.status === "active"
                            ? "text-emerald-400"
                            : "text-muted-foreground"
                        }`}
                >
                    <span
                        className={`w-1.5 h-1.5 rounded-full ${project.status === "active" ? "bg-emerald-400" : "bg-muted-foreground"
                            }`}
                    />
                    {project.status}
                </span>
            </div>
        </Link>
    );
}
