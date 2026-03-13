"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import ComplianceService, {
    type ConsentType,
    type ConsentStatus,
    type ConsentRecord,
    type AuditLogEntry,
} from "@/services/ComplianceService";

const CONSENT_TYPES: { type: ConsentType; label: string; description: string }[] = [
    { type: "data_processing", label: "Data Processing", description: "Allow processing of personal data for core platform functionality" },
    { type: "marketing_emails", label: "Marketing Emails", description: "Receive product updates and promotional communications" },
    { type: "analytics", label: "Analytics", description: "Allow collection of usage analytics to improve the platform" },
    { type: "third_party_sharing", label: "Third-Party Sharing", description: "Allow sharing anonymized data with third-party services" },
    { type: "cookies", label: "Cookies", description: "Allow use of cookies for session management and preferences" },
    { type: "terms_of_service", label: "Terms of Service", description: "Accept the platform terms of service" },
];

export default function CompliancePage() {
    const [consents, setConsents] = useState<ConsentStatus[]>([]);
    const [history, setHistory] = useState<ConsentRecord[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [togglingConsent, setTogglingConsent] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        try {
            const [consentStatus, consentHistory, logs] = await Promise.all([
                ComplianceService.getConsentStatus(),
                ComplianceService.getConsentHistory(),
                ComplianceService.getAuditLogs(50),
            ]);
            setConsents(consentStatus);
            setHistory(consentHistory);
            setAuditLogs(logs);
        } catch {
            setMessage("Failed to load compliance data");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const handleToggleConsent = async (type: ConsentType, currentlyGranted: boolean) => {
        setTogglingConsent(type);
        try {
            await ComplianceService.recordConsent(type, !currentlyGranted);
            await loadData();
            setMessage(`Consent ${!currentlyGranted ? "granted" : "revoked"} for ${type.replace(/_/g, " ")}`);
        } catch {
            setMessage("Failed to update consent");
        } finally {
            setTogglingConsent(null);
        }
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const data = await ComplianceService.exportData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `user-data-export-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            setMessage("Data exported successfully");
        } catch {
            setMessage("Failed to export data");
        } finally {
            setExporting(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await ComplianceService.deleteAccount();
            // Clear tokens and redirect
            if (typeof window !== "undefined") {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                window.location.href = "/";
            }
        } catch {
            setMessage("Failed to delete account");
            setDeleting(false);
            setDeleteConfirm(false);
        }
    };

    const getConsentGranted = (type: ConsentType): boolean => {
        const found = consents.find((c) => c.consentType === type);
        return found?.granted ?? false;
    };

    if (loading) {
        return (
            <div className="space-y-4 max-w-4xl">
                <div className="h-8 w-48 bg-muted/20 rounded animate-pulse" />
                <div className="h-64 bg-muted/10 rounded animate-pulse" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h2 className="text-lg font-semibold">Privacy &amp; Compliance</h2>
                <p className="text-sm text-muted-foreground">
                    Manage your data, consent preferences, and view your activity log. GDPR Articles 12-22.
                </p>
            </div>

            {message && (
                <div className="p-3 rounded-lg bg-muted/10 border text-sm text-muted-foreground">
                    {message}
                    <button className="ml-2 text-xs underline" onClick={() => setMessage(null)}>dismiss</button>
                </div>
            )}

            {/* ── Consent Management ── */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <CardTitle>Consent Preferences</CardTitle>
                        <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400">GDPR Art. 7</Badge>
                    </div>
                    <CardDescription>
                        Control how your data is used. You can grant or revoke consent at any time. Each change is recorded immutably.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {CONSENT_TYPES.map(({ type, label, description }) => {
                        const granted = getConsentGranted(type);
                        const isToggling = togglingConsent === type;
                        return (
                            <div key={type} className="flex items-center justify-between gap-4 py-2">
                                <div className="flex-1">
                                    <Label className="text-sm font-medium">{label}</Label>
                                    <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        className={`text-[10px] ${granted ? "border-emerald-500/30 text-emerald-400" : "border-red-500/30 text-red-400"}`}
                                    >
                                        {granted ? "Granted" : "Not Granted"}
                                    </Badge>
                                    <Switch
                                        checked={granted}
                                        onCheckedChange={() => handleToggleConsent(type, granted)}
                                        disabled={isToggling}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </CardContent>
            </Card>

            {/* ── Data Export ── */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <CardTitle>Data Export</CardTitle>
                        <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400">GDPR Art. 15 &amp; 20</Badge>
                    </div>
                    <CardDescription>
                        Download a complete copy of your personal data in JSON format. Includes your profile, consent history, and activity log.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleExport} disabled={exporting} variant="outline">
                        {exporting ? "Exporting..." : "Export My Data"}
                    </Button>
                </CardContent>
            </Card>

            {/* ── Audit Log ── */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <CardTitle>Activity Log</CardTitle>
                        <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400">GDPR Art. 12</Badge>
                    </div>
                    <CardDescription>
                        A record of actions performed on or with your account. You can request a full copy via data export.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {auditLogs.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
                    ) : (
                        <div className="max-h-80 overflow-y-auto space-y-1">
                            {auditLogs.map((log) => (
                                <div key={log.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/5 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-[10px] font-mono">
                                            {log.action}
                                        </Badge>
                                        {log.resource && (
                                            <span className="text-xs text-muted-foreground">{log.resource}</span>
                                        )}
                                    </div>
                                    <span className="text-xs text-muted-foreground/60">
                                        {new Date(log.createdAt).toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── Consent History ── */}
            {history.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Consent Change History</CardTitle>
                        <CardDescription>
                            Immutable log of all consent changes. This record cannot be modified or deleted.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="max-h-60 overflow-y-auto space-y-1">
                            {history.map((entry) => (
                                <div key={entry.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/5 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant="outline"
                                            className={`text-[10px] ${entry.granted ? "border-emerald-500/30 text-emerald-400" : "border-red-500/30 text-red-400"}`}
                                        >
                                            {entry.granted ? "Granted" : "Revoked"}
                                        </Badge>
                                        <span className="text-xs font-mono">{entry.consentType.replace(/_/g, " ")}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground/60">
                                        {new Date(entry.createdAt).toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <Separator />

            {/* ── Account Deletion ── */}
            <Card className="border-red-500/20">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-red-400">Delete Account</CardTitle>
                        <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-400">GDPR Art. 17</Badge>
                    </div>
                    <CardDescription>
                        Permanently delete your account and all associated data. This action cannot be undone.
                        Audit logs will be anonymized (not deleted) per GDPR Art. 17(3) record-keeping exception.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!deleteConfirm ? (
                        <Button
                            variant="outline"
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                            onClick={() => setDeleteConfirm(true)}
                        >
                            Request Account Deletion
                        </Button>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-sm text-red-400">
                                Are you sure? This will permanently delete your account, tokens, and consent records. Audit logs will be anonymized.
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="destructive"
                                    onClick={handleDelete}
                                    disabled={deleting}
                                >
                                    {deleting ? "Deleting..." : "Yes, Delete My Account"}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setDeleteConfirm(false)}
                                    disabled={deleting}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── Compliance Statement ── */}
            <Card>
                <CardHeader>
                    <CardTitle>Compliance Notice</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>
                        Unlike cloud BaaS platforms that manage compliance for users, this platform is self-hosted.
                        This gives developers full control and data ownership, but also places the responsibility
                        of GDPR and HIPAA compliance on the operator.
                    </p>
                    <p>
                        The platform provides tools (data export, deletion, consent management, audit logs)
                        to make compliance easier, but final responsibility lies with the user running the instance.
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                        This platform is not HIPAA compliant out of the box. Users running healthcare applications
                        must implement additional controls, encryption, audit logging, and sign legal agreements themselves.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
