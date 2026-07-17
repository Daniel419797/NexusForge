"use client";

import type { ReactNode } from "react";
import {
  Bell,
  BookOpenText,
  Boxes,
  Braces,
  Database,
  GitPullRequestArrow,
  KeyRound,
  LayoutDashboard,
  Map as MapIcon,
  Plug,
  Rocket,
  Settings2,
  Workflow,
} from "lucide-react";

import { getPublishedSdkCatalog } from "@/lib/sdk-catalog";

export interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  exact?: boolean;
  children?: Array<{
    label: string;
    href: string;
  }>;
}

const iconClassName = "h-[18px] w-[18px]";

export const globalNavItems: NavItem[] = [
  {
    label: "Mission Control",
    href: "/projects",
    exact: true,
    icon: <LayoutDashboard className={iconClassName} aria-hidden="true" />,
  },
  {
    label: "Notifications",
    href: "/notifications",
    icon: <Bell className={iconClassName} aria-hidden="true" />,
  },
];

export function getProjectNavItems(projectId: string): NavItem[] {
  const projectBase = `/projects/${projectId}`;
  const publishedSdkFamilies = getPublishedSdkCatalog();

  return [
    {
      label: "Setup Map",
      href: "/projects",
      exact: true,
      icon: <MapIcon className={iconClassName} aria-hidden="true" />,
    },
    {
      label: "Overview",
      href: projectBase,
      exact: true,
      icon: <LayoutDashboard className={iconClassName} aria-hidden="true" />,
    },
    {
      label: "Data Models",
      href: `${projectBase}/tables`,
      icon: <Database className={iconClassName} aria-hidden="true" />,
    },
    {
      label: "API",
      href: `${projectBase}/api`,
      icon: <Braces className={iconClassName} aria-hidden="true" />,
    },
    {
      label: "API Keys",
      href: `${projectBase}/api-keys`,
      icon: <KeyRound className={iconClassName} aria-hidden="true" />,
    },
    {
      label: "Automation",
      href: `${projectBase}/settings/modules/logic-modules`,
      icon: <Workflow className={iconClassName} aria-hidden="true" />,
    },
    {
      label: "Deployments",
      href: `${projectBase}/deploy`,
      icon: <Rocket className={iconClassName} aria-hidden="true" />,
    },
    {
      label: "Frontend Wiring",
      href: `${projectBase}/frontend-integrations`,
      icon: (
        <GitPullRequestArrow className={iconClassName} aria-hidden="true" />
      ),
    },
    {
      label: "Documentation",
      href: `${projectBase}/documentation`,
      icon: <BookOpenText className={iconClassName} aria-hidden="true" />,
    },
    {
      label: "SDKs",
      href: `${projectBase}/sdk`,
      children: publishedSdkFamilies.map((family) => ({
        label: family.name,
        href: `${projectBase}/sdk/${family.slug}`,
      })),
      icon: <Boxes className={iconClassName} aria-hidden="true" />,
    },
    {
      label: "Plugins",
      href: `${projectBase}/plugins`,
      icon: <Plug className={iconClassName} aria-hidden="true" />,
    },
    {
      label: "Settings",
      href: `${projectBase}/settings`,
      children: [
        { label: "Database", href: `${projectBase}/settings/database` },
        { label: "Modules", href: `${projectBase}/settings/modules` },
        { label: "Members", href: `${projectBase}/settings/members` },
        { label: "Compliance", href: `${projectBase}/settings/compliance` },
      ],
      icon: <Settings2 className={iconClassName} aria-hidden="true" />,
    },
  ];
}
