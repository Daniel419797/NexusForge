"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import ElectricRippleButton from "@/components/Dashboard/ElectricRippleButton";
import ScrollReveal from "@/components/Dashboard/ScrollReveal";
import NotificationService, { type Notification, type PushDevice } from "@/services/NotificationService";

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [devices, setDevices] = useState<PushDevice[]>([]);
    const [devicesLoading, setDevicesLoading] = useState(false);
    const [showDevices, setShowDevices] = useState(false);
    const [showPrefs, setShowPrefs] = useState(false);

    // Notification preferences (persisted in localStorage)
    const [prefs, setPrefs] = useState({
        emailEnabled: true,
        pushEnabled: true,
        inAppEnabled: true,
        deployAlerts: true,
        securityAlerts: true,
        usageAlerts: true,
    });

    useEffect(() => {
        try {
            const saved = localStorage.getItem("notification-prefs");
            if (saved) setPrefs(JSON.parse(saved));
        } catch { /* ignore */ }
    }, []);

    const updatePref = (key: keyof typeof prefs) => {
        const next = { ...prefs, [key]: !prefs[key] };
        setPrefs(next);
        localStorage.setItem("notification-prefs", JSON.stringify(next));
    };

    const fetchNotifications = async () => {
        try {
            const resp = await NotificationService.getNotifications({ limit: 50 });
            setNotifications((resp as any).items || []);
        } catch { /* ignore */ } finally { setLoading(false); }
    };

    useEffect(() => { fetchNotifications(); }, []);

    const handleMarkAsRead = async (id: string) => {
        try {
            await NotificationService.markAsRead(id);
            setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
        } catch { /* ignore */ }
    };

    const handleMarkAllRead = async () => {
        try {
            await NotificationService.markAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        } catch { /* ignore */ }
    };

    const fetchDevices = async () => {
        setDevicesLoading(true);
        try { const data = await NotificationService.getDevices(); setDevices(data); }
        catch { /* ignore */ } finally { setDevicesLoading(false); }
    };

    const handleRemoveDevice = async (deviceId: string) => {
        if (!confirm("Remove this device?")) return;
        try {
            await NotificationService.removeDevice(deviceId);
            setDevices((prev) => prev.filter((d) => d.id !== deviceId));
        } catch { /* ignore */ }
    };

    const unreadCount = notifications.filter((n) => !n.read).length;

    return (
        <div className="max-w-3xl mx-auto">
            {/* Header */}
            <ScrollReveal direction="up" className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-display tracking-tight text-white">Notifications</h1>
                    <p className="text-sm text-white/50 mt-2">Stay updated on your platform activity.</p>
                </div>
                <div className="flex gap-2">
                    <ElectricRippleButton
                        accent="emerald"
                        className="px-4 py-2 text-sm rounded-xl border border-white/10 bg-white/[0.04] text-white/70 hover:text-white"
                        onClick={() => setShowPrefs(!showPrefs)}
                    >
                        {showPrefs ? "Hide Preferences" : "Preferences"}
                    </ElectricRippleButton>
                    <ElectricRippleButton
                        accent="cyan"
                        className="px-4 py-2 text-sm rounded-xl border border-white/10 bg-white/[0.04] text-white/70 hover:text-white"
                        onClick={() => { setShowDevices(!showDevices); if (!showDevices && devices.length === 0) fetchDevices(); }}
                    >
                        {showDevices ? "Hide Devices" : "Push Devices"}
                    </ElectricRippleButton>
                    <ElectricRippleButton
                        accent="purple"
                        className="px-4 py-2 text-sm rounded-xl border border-white/10 bg-white/[0.04] text-white/70 hover:text-white"
                        onClick={handleMarkAllRead}
                    >
                        Mark all read
                    </ElectricRippleButton>
                </div>
            </ScrollReveal>

            {/* Unread badge */}
            {unreadCount > 0 && (
                <ScrollReveal direction="left" delay={0.1} className="mb-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20">
                        <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                        <span className="text-xs text-rose-300 font-medium">{unreadCount} unread</span>
                    </div>
                </ScrollReveal>
            )}

            {/* Notification preferences section */}
            <AnimatePresence>
                {showPrefs && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-8 overflow-hidden"
                    >
                        <div>
                            <h2 className="text-sm font-semibold text-white/70 mb-4">Notification Preferences</h2>
                            <div className="space-y-3">
                                {([
                                    { key: "emailEnabled" as const, label: "Email Notifications", desc: "Receive notifications via email" },
                                    { key: "pushEnabled" as const, label: "Push Notifications", desc: "Receive browser/device push notifications" },
                                    { key: "inAppEnabled" as const, label: "In-App Notifications", desc: "Show notifications in the dashboard" },
                                    { key: "deployAlerts" as const, label: "Deploy Alerts", desc: "Deployment success/failure notifications" },
                                    { key: "securityAlerts" as const, label: "Security Alerts", desc: "Login attempts, API key rotations" },
                                    { key: "usageAlerts" as const, label: "Usage Alerts", desc: "Quota warnings and rate limit events" },
                                ]).map(({ key, label, desc }) => (
                                    <div key={key} className="flex items-center justify-between py-2">
                                        <div>
                                            <p className="text-sm font-medium text-white/80">{label}</p>
                                            <p className="text-xs text-white/40">{desc}</p>
                                        </div>
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={prefs[key]}
                                            onClick={() => updatePref(key)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                                prefs[key] ? "bg-emerald-500" : "bg-white/10"
                                            }`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                prefs[key] ? "translate-x-6" : "translate-x-1"
                                            }`} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Push devices section */}
            <AnimatePresence>
                {showDevices && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-8 space-y-3 overflow-hidden"
                    >
                        <h2 className="text-sm font-semibold text-white/70">Registered Push Devices</h2>
                        {devicesLoading ? (
                            <div className="h-16 w-full rounded-2xl bg-white/[0.03] animate-pulse" />
                        ) : devices.length === 0 ? (
                            <p className="text-sm text-white/50 text-center py-4">No push devices registered. Enable push in your browser or app.</p>
                        ) : (
                            devices.map((device) => (
                                <div key={device.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-sm font-medium text-white">{device.platform}</p>
                                            <p className="text-xs text-white/40 font-mono">{device.token.substring(0, 20)}...</p>
                                        </div>
                                        <ElectricRippleButton
                                            accent="magenta"
                                            className="px-3 py-1 text-xs rounded-lg text-red-400 hover:text-red-300 border border-red-500/20 bg-red-500/5"
                                            onClick={() => handleRemoveDevice(device.id)}
                                        >
                                            Remove
                                        </ElectricRippleButton>
                                    </div>
                                </div>
                            ))
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Notifications list */}
            <div className="space-y-3">
                {loading && [1, 2, 3].map((i) => (
                    <div key={i} className="w-full h-24 rounded-2xl bg-white/[0.03] animate-pulse" />
                ))}

                {!loading && notifications.length === 0 && (
                    <ScrollReveal>
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <span className="text-4xl mb-4">📭</span>
                            <p className="text-white/50">You&apos;re all caught up!</p>
                        </div>
                    </ScrollReveal>
                )}

                <AnimatePresence>
                    {!loading && notifications.map((notif, index) => (
                        <ScrollReveal key={notif.id} direction="up" delay={index * 0.04}>
                            <div className={`rounded-xl border px-4 py-3 ${!notif.read ? "border-rose-500/20 bg-white/[0.02] ring-1 ring-rose-500/20" : "border-white/[0.06] bg-white/[0.02]"}`}>
                                <div className="flex gap-3">
                                    {/* Unread indicator dot */}
                                    {!notif.read && (
                                        <div className="pt-1.5 shrink-0">
                                            <span className="block w-2 h-2 rounded-full bg-rose-400" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start gap-2 mb-1">
                                            <h3 className={`text-sm font-semibold ${!notif.read ? "text-white" : "text-white/60"}`}>
                                                {notif.title}
                                            </h3>
                                            <span className="text-xs text-white/40 whitespace-nowrap">
                                                {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                        {notif.body && (
                                            <p className="text-sm text-white/50 mb-3">{notif.body}</p>
                                        )}
                                        {!notif.read && (
                                            <button
                                                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                                                onClick={() => handleMarkAsRead(notif.id)}
                                            >
                                                Mark as read
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </ScrollReveal>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
