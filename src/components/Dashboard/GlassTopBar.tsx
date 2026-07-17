"use client";

import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LogOut, Menu, Plus, Rocket } from "lucide-react";

import NotificationBell from "@/components/Notifications/NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CREATE_PROJECT_EVENT,
  CREATE_PROJECT_PENDING_KEY,
} from "@/lib/dashboard-events";
import { useProjectStore } from "@/store/projectStore";

interface GlassTopBarProps {
  userName?: string | null;
  userEmail?: string | null;
  onLogout: () => void;
  onMenuToggle?: () => void;
}

export default function GlassTopBar({
  userName,
  userEmail,
  onLogout,
  onMenuToggle,
}: GlassTopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const activeProject = useProjectStore((state) => state.activeProject);
  const initials = (userName || userEmail || "User")
    .split(/[\s@]/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleCreateProject = () => {
    if (pathname === "/projects") {
      globalThis.dispatchEvent(new Event(CREATE_PROJECT_EVENT));
      return;
    }

    globalThis.sessionStorage?.setItem(CREATE_PROJECT_PENDING_KEY, "true");
    router.push("/projects");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#1a252b] bg-[#080c0f]/95 px-4 backdrop-blur-md md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuToggle}
          className="flex size-9 items-center justify-center rounded-[4px] border border-white/[0.07] text-white/55 hover:border-white/15 hover:text-white md:hidden"
          aria-label="Open navigation"
        >
          <Menu className="size-[18px]" aria-hidden="true" />
        </button>
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-cyan-300/70">
            Control plane
          </p>
          <p className="truncate text-[11px] font-semibold text-white/55">
            {activeProject?.name ?? "All projects"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleCreateProject}
          className="hidden h-9 items-center gap-2 rounded-[4px] border border-white/[0.08] bg-white/[0.025] px-3 text-[11px] font-bold text-white/55 hover:border-white/15 hover:text-white sm:flex"
        >
          <Plus className="size-3.5" aria-hidden="true" />
          New project
        </button>

        <button
          type="button"
          onClick={() =>
            router.push(
              activeProject
                ? `/projects/${activeProject.id}/deploy`
                : "/projects",
            )
          }
          className="hidden h-9 items-center gap-2 rounded-[4px] border border-cyan-300/20 bg-cyan-300/[0.07] px-3 text-[11px] font-bold text-cyan-200 hover:border-cyan-300/40 lg:flex"
        >
          <Rocket className="size-3.5" aria-hidden="true" />
          Deploy
        </button>

        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-9 items-center gap-2 rounded-[4px] border border-white/[0.08] bg-white/[0.025] px-1.5 text-white/70 hover:border-white/15"
              aria-label="Open user menu"
            >
              <span className="flex size-6 items-center justify-center rounded-[3px] bg-cyan-300/15 text-[9px] font-extrabold text-cyan-200">
                {initials}
              </span>
              <ChevronDown
                className="hidden size-3 text-white/35 sm:block"
                aria-hidden="true"
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>
              <span className="block truncate text-xs">
                {userName || "User"}
              </span>
              {userEmail && (
                <span className="mt-0.5 block truncate text-[10px] font-normal text-muted-foreground">
                  {userEmail}
                </span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onLogout}>
              <LogOut className="size-4" aria-hidden="true" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
