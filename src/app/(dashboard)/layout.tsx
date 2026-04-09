"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuthStore } from "@/store/authStore";
import { useProjectStore } from "@/store/projectStore";
import { useOnboardingStore } from "@/store/onboardingStore";
import AuthProvider from "@/components/Auth/AuthProvider";
import GlassSidebar from "@/components/Dashboard/GlassSidebar";
import GlassTopBar from "@/components/Dashboard/GlassTopBar";
import { globalNavItems, getProjectNavItems } from "@/components/layout/nav-items";

/** Tailwind md breakpoint in px */
const MD_BREAKPOINT = 768;

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const pathname = usePathname();
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const activeProject = useProjectStore((s) => s.activeProject);
    const onboardingCompleted = useOnboardingStore((s) => s.completed);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(
        () => globalThis.window !== undefined && globalThis.matchMedia(`(max-width: ${MD_BREAKPOINT - 1}px)`).matches,
    );

    // Redirect to onboarding if not completed (skip if already on /onboarding)
    useEffect(() => {
        if (!onboardingCompleted && pathname !== "/onboarding") {
            router.replace("/onboarding");
        }
    }, [onboardingCompleted, pathname, router]);

    // Track viewport width
    useEffect(() => {
        const mq = globalThis.matchMedia(`(max-width: ${MD_BREAKPOINT - 1}px)`);
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
    const toggleSidebarCollapsed = useCallback(() => setSidebarCollapsed((v) => !v), []);

    // Detect when we're viewing a specific project route (e.g. /projects/:id...)
    const pathSegments = pathname?.split("/").filter(Boolean) || [];
    const isProjectRoute = pathSegments[0] === "projects" && !!pathSegments[1];
    const projectId = isProjectRoute ? pathSegments[1] : undefined;

    const navItems =
        isProjectRoute && projectId
            ? getProjectNavItems(projectId)
            : globalNavItems;

    const isOnboarding = pathname === "/onboarding";
    const desktopMargin = sidebarCollapsed ? 64 : 240;
    const contentMarginLeft = isMobile ? 0 : desktopMargin;

    // During onboarding, render a minimal chrome-less layout
    if (isOnboarding) {
        return (
            <AuthProvider>
                <div className="min-h-screen">
                    <main className="px-4 py-5 sm:p-6">{children}</main>
                </div>
            </AuthProvider>
        );
    }

    return (
        <AuthProvider>
            <div className="relative z-10 min-h-screen flex">
                <GlassSidebar
                    items={navItems}
                    pathname={pathname}
                    collapsed={sidebarCollapsed}
                    onToggleCollapse={toggleSidebarCollapsed}
                    activeProjectName={activeProject?.name}
                    mobileOpen={mobileOpen}
                    onMobileClose={() => setMobileOpen(false)}
                />

                {/* Main content area */}
                <div
                    className="flex-1 min-w-0 transition-all duration-300"
                    style={{
                        marginLeft: contentMarginLeft,
                    }}
                >
                    <GlassTopBar
                        userName={user?.name}
                        userEmail={user?.email}
                        sidebarCollapsed={sidebarCollapsed}
                        onLogout={() => {
                            logout();
                            globalThis.location.href = "/login";
                        }}
                        onMenuToggle={toggleMobileDrawer}
                        isMobile={isMobile}
                    />
                    <main id="main-content" className="px-4 py-5 sm:p-6">{children}</main>
                </div>
            </div>
        </AuthProvider>
    );
}
