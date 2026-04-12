import { create } from "zustand";

export interface OnboardingState {
    /** Current wizard step (0-indexed) */
    step: number;
    /** Project name chosen in step 1 */
    projectName: string;
    /** Template category chosen in step 1 */
    category: string;
    /** Modules/plugins selected in step 2 */
    enabledModules: string[];
    /** Database type chosen in step 3 */
    dbType: string;
    /** Whether onboarding is complete (persisted to localStorage) */
    completed: boolean;
    /** ID of the project created during onboarding */
    createdProjectId: string | null;
    /** Project token returned after creation */
    projectToken: string | null;

    // Actions
    setStep: (step: number) => void;
    nextStep: () => void;
    prevStep: () => void;
    setProjectName: (name: string) => void;
    setCategory: (category: string) => void;
    toggleModule: (module: string) => void;
    setDbType: (dbType: string) => void;
    setCreatedProject: (projectId: string, token: string) => void;
    markCompleted: () => void;
    reset: () => void;
}

const TOTAL_STEPS = 4;

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
    step: 0,
    projectName: "",
    category: "",
    enabledModules: [],
        dbType: "postgresql",
    completed: typeof window !== "undefined"
        ? localStorage.getItem("onboardingComplete") === "true"
        : false,
    createdProjectId: null,
    projectToken: null,

    setStep: (step) => set({ step: Math.max(0, Math.min(TOTAL_STEPS - 1, step)) }),
    nextStep: () => {
        const { step } = get();
        if (step < TOTAL_STEPS - 1) set({ step: step + 1 });
    },
    prevStep: () => {
        const { step } = get();
        if (step > 0) set({ step: step - 1 });
    },
    setProjectName: (projectName) => set({ projectName }),
    setCategory: (category) => set({ category }),
    toggleModule: (module) => {
        const { enabledModules } = get();
        if (enabledModules.includes(module)) {
            set({ enabledModules: enabledModules.filter((m) => m !== module) });
        } else {
            set({ enabledModules: [...enabledModules, module] });
        }
    },
    setDbType: (dbType) => set({ dbType }),
    setCreatedProject: (projectId, token) =>
        set({ createdProjectId: projectId, projectToken: token }),
    markCompleted: () => {
        if (typeof window !== "undefined") {
            localStorage.setItem("onboardingComplete", "true");
        }
        set({ completed: true });
    },
    reset: () =>
        set({
            step: 0,
            projectName: "",
            category: "",
            enabledModules: [],
                dbType: "postgresql",
            createdProjectId: null,
            projectToken: null,
        }),
}));
