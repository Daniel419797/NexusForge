"use client";

import React from "react";

export interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
    /** When true, only an exact pathname match marks this item active. */
    exact?: boolean;
    children?: Array<{
        label: string;
        href: string;
    }>;
}

export const globalNavItems: NavItem[] = [
    {
        label: "Projects",
        href: "/projects",
        icon: (
            <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
        ),
    },
    {
        label: "Notifications",
        href: "/notifications",
        icon: (
            <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
        ),
    },
];

/** Build project-specific nav items for a given project ID. */
export function getProjectNavItems(projectId: string): NavItem[] {
    return [
        {
            label: "Documentation",
            href: `/projects/${projectId}/documentation`,
            children: [
                { label: "Step 1 · API Base URL", href: `/projects/${projectId}/documentation#step-1` },
                { label: "Step 2 · Authentication", href: `/projects/${projectId}/documentation#step-2` },
                { label: "Step 3 · API Endpoints", href: `/projects/${projectId}/documentation#step-3` },
                { label: "Step 4 · Quick Start", href: `/projects/${projectId}/documentation#step-4` },
                { label: "Step 5 · Real-World Example App", href: `/projects/${projectId}/documentation#step-5` },
            ],
            icon: (
                <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.58-5.84a14.927 14.927 0 00-2.58 5.84" />
                </svg>
            ),
        },
        {
            label: "Overview",
            href: `/projects/${projectId}`,
            exact: true,
            icon: (
                <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M3 6h18M3 18h18" />
                </svg>
            ),
        },
        {
            label: "API",
            href: `/projects/${projectId}/api`,
            icon: (
                <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7l4-4 4 4M8 17l4 4 4-4" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18" />
                </svg>
            ),
        },
        {
            label: "API Keys",
            href: `/projects/${projectId}/api-keys`,
            icon: (
                <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0-1.657-1.343-3-3-3S6 9.343 6 11s1.343 3 3 3 3-1.343 3-3z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6" />
                </svg>
            ),
        },
        {
            label: "Plugins",
            href: `/projects/${projectId}/plugins`,
            icon: (
                <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12.75v.75a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021.75 13.5v-.75" />
                </svg>
            ),
        },
        {
            label: "Deploy",
            href: `/projects/${projectId}/deploy`,
            icon: (
                <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.58-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                </svg>
            ),
        },

        {
            label: "Tables",
            href: `/projects/${projectId}/tables`,
            icon: (
                <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 5.496 4.5 4.875 4.5m1.125 0h1.5m-1.5 7.5h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C8.496 8.25 9 8.754 9 9.375v1.5M9 7.5V6.375C9 5.754 9.504 5.25 10.125 5.25m0 0h3.75m-3.75 0C9.504 5.25 9 5.754 9 6.375M9 7.5h6m0-1.125C15 5.754 15.504 5.25 16.125 5.25m-6.75 8.25H15m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M15 15.75v-5.25M15 10.5h1.5m1.5 5.25h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M18 15.75v-5.25M18 10.5h1.5" />
                </svg>
            ),
        },
        {
            label: "Settings",
            href: `/projects/${projectId}/settings`,
            children: [
                { label: "Database", href: `/projects/${projectId}/settings/database` },
                { label: "Compliance", href: `/projects/${projectId}/settings/compliance` },
                { label: "Members", href: `/projects/${projectId}/settings/members` },
                { label: "Modules", href: `/projects/${projectId}/settings/modules` },
            ],
            icon: (
                <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
        },
    ];
}
