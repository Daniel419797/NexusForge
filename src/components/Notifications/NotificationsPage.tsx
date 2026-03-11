"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import GlassPanel from "@/components/Dashboard/GlassPanel";
import ElectricRippleButton from "@/components/Dashboard/ElectricRippleButton";
import ScrollReveal from "@/components/Dashboard/ScrollReveal";
import NotificationService, { type Notification, type PushDevice } from "@/services/NotificationService";

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [devices, setDevices] = useState<PushDevice[]>([]);
    const [devicesLoading, setDevicesLoading] = useState(false);
    const [showDevices, setShowDevices] = useState(false);

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
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20">
                        <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                        <span className="text-xs text-purple-300 font-medium">{unreadCount} unread</span>
                    </div>
                </ScrollReveal>
            )}

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
                            <GlassPanel accent="cyan">
                                <p className="text-sm text-white/50 text-center py-2">No push devices registered. Enable push in your browser or app.</p>
                            </GlassPanel>
                        ) : (
                            devices.map((device) => (
                                <GlassPanel key={device.id} accent="cyan" className="!p-4">
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
                                </GlassPanel>
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
                        <GlassPanel accent="purple">
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <span className="text-4xl mb-4">📭</span>
                                <p className="text-white/50">You&apos;re all caught up!</p>
                            </div>
                        </GlassPanel>
                    </ScrollReveal>
                )}

                <AnimatePresence>
                    {!loading && notifications.map((notif, index) => (
                        <ScrollReveal key={notif.id} direction="up" delay={index * 0.04}>
                            <GlassPanel
                                accent={!notif.read ? "purple" : "cyan"}
                                className={!notif.read ? "ring-1 ring-purple-500/20" : ""}
                            >
                                <div className="flex gap-3">
                                    {/* Unread indicator dot */}
                                    {!notif.read && (
                                        <div className="pt-1.5 shrink-0">
                                            <span className="block w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
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
                            </GlassPanel>
                        </ScrollReveal>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
