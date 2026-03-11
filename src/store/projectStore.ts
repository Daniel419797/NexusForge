import { create } from "zustand";
import type { Project } from "@/types";
import ProjectService, { type CategoryTemplate } from "@/services/ProjectService";

interface ProjectState {
    projects: Project[];
    activeProject: Project | null;
    templates: CategoryTemplate[];
    setProjects: (projects: Project[]) => void;
    setActiveProject: (project: Project | null) => void;
    fetchTemplates: () => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
    projects: [],
    activeProject: null,
    templates: [],
    setProjects: (projects) => set({ projects }),
    setActiveProject: (activeProject) => set({ activeProject }),
    fetchTemplates: async () => {
        const { templates } = get();
        if (templates.length > 0) return; // Already fetched
        try {
            const data = await ProjectService.getTemplates();
            set({ templates: data });
        } catch (error) {
            console.error("Failed to fetch templates", error);
        }
    },
}));
