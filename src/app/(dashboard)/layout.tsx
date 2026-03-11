"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useProjectStore } from "@/store/projectStore";
import { useOnboardingStore } from "@/store/onboardingStore";
import AuthProvider from "@/components/Auth/AuthProvider";
import GlassSidebar from "@/components/Dashboard/GlassSidebar";
import GlassTopBar from "@/components/Dashboard/GlassTopBar";
import { globalNavItems, getProjectNavItems } from "@/components/layout/nav-items";

const DashboardBackground = dynamic(
    () => import("@/components/Dashboard/DashboardBackground"),
    { ssr: false },
);

const CursorTrail = dynamic(
    () => import("@/components/Dashboard/CursorTrail"),
    { ssr: false },
);

/** Tailwind md breakpoint in px */
const MD_BREAKPOINT = 768;

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const activeProject = useProjectStore((s) => s.activeProject);
    const onboardingCompleted = useOnboardingStore((s) => s.completed);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Redirect to onboarding if not completed (skip if already on /onboarding)
    useEffect(() => {
        if (!onboardingCompleted && pathname !== "/onboarding") {
            router.replace("/onboarding");
        }
    }, [onboardingCompleted, pathname, router]);

    // Track viewport width
    useEffect(() => {
        const mq = window.matchMedia(`(max-width: ${MD_BREAKPOINT - 1}px)`);
        const handler = (e: MediaQueryListEvent | MediaQueryList) => {
            setIsMobile(e.matches);
            if (!e.matches) setMobileOpen(false); // close drawer when resizing to desktop
        };
        handler(mq);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);

    // Close mobile drawer on navigation
    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    const toggleMobileDrawer = useCallback(() => setMobileOpen((v) => !v), []);

    // Detect when we're viewing a specific project route (e.g. /projects/:id...)
    const pathSegments = pathname?.split("/").filter(Boolean) || [];
    const isProjectRoute = pathSegments[0] === "projects" && !!pathSegments[1];
    const projectId = isProjectRoute ? pathSegments[1] : undefined;

    const navItems =
        isProjectRoute && projectId
            ? getProjectNavItems(projectId)
            : globalNavItems;

    const isOnboarding = pathname === "/onboarding";

    // During onboarding, render a minimal chrome-less layout
    if (isOnboarding) {
        return (
            <AuthProvider>
                <DashboardBackground />
                <div className="relative z-10 min-h-screen">
                    <main className="px-4 py-5 sm:p-6">{children}</main>
                </div>
            </AuthProvider>
        );
    }

    return (
        <AuthProvider>
            {/* WebGL shader background */}
            <DashboardBackground />
            {/* Cursor particle trail (desktop only) */}
            {!isMobile && <CursorTrail />}

            <div className="relative z-10 min-h-screen flex">
                <GlassSidebar
                    items={navItems}
                    pathname={pathname}
                    collapsed={sidebarCollapsed}
                    onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                    activeProjectName={activeProject?.name}
                    mobileOpen={mobileOpen}
                    onMobileClose={() => setMobileOpen(false)}
                />

                {/* Main content area */}
                <div
                    className="flex-1 min-w-0 transition-all duration-300"
                    style={{
                        marginLeft: isMobile ? 0 : sidebarCollapsed ? 64 : 240,
                    }}
                >
                    <GlassTopBar
                        userName={user?.name}
                        userEmail={user?.email}
                        sidebarCollapsed={sidebarCollapsed}
                        onLogout={() => {
                            logout();
                            window.location.href = "/login";
                        }}
                        onMenuToggle={toggleMobileDrawer}
                        isMobile={isMobile}
                    />
                    <main className="px-4 py-5 sm:p-6">{children}</main>
                </div>
            </div>
        </AuthProvider>
    );
}
