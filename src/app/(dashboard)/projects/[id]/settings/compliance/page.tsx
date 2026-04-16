"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
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
    type HipaaStatus,
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
    const params = useParams();
    const projectId = params.id as string | undefined;
    const [consents, setConsents] = useState<ConsentStatus[]>([]);
    const [history, setHistory] = useState<ConsentRecord[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
    const [hipaaStatus, setHipaaStatus] = useState<HipaaStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [togglingConsent, setTogglingConsent] = useState<string | null>(null);
    const [togglingHipaa, setTogglingHipaa] = useState(false);
    const [unsubscribeToken, setUnsubscribeToken] = useState<string | null>(null);
    const [unsubscribeInput, setUnsubscribeInput] = useState("");
    const [breachDescription, setBreachDescription] = useState("");
    const [breachDataAffected, setBreachDataAffected] = useState("");
    const [breachSeverity, setBreachSeverity] = useState<"low" | "medium" | "high" | "critical">("medium");
    const [breaches, setBreaches] = useState<any[]>([]);
    const [loadingBreaches, setLoadingBreaches] = useState(false);
    const [submittingBreach, setSubmittingBreach] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const [consentStatus, consentHistory, logs, hipaa] = await Promise.all([
                ComplianceService.getConsentStatus(projectId),
                ComplianceService.getConsentHistory(projectId),
                ComplianceService.getAuditLogs(50, projectId),
                ComplianceService.getHipaaStatus(projectId).catch(() => null),
            ]);
            setConsents(consentStatus);
            setHistory(consentHistory);
            setAuditLogs(logs);
            setHipaaStatus(hipaa);
        } catch {
            setMessage("Failed to load compliance data");
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleToggleHipaa = async () => {
        if (!hipaaStatus) return;
        setTogglingHipaa(true);
        try {
            const newMode = !hipaaStatus.hipaaMode;
            await ComplianceService.toggleHipaaMode(newMode, projectId);
            await loadData();
            setMessage(`HIPAA mode ${newMode ? "enabled" : "disabled"} for this project`);
        } catch {
            setMessage("Failed to toggle HIPAA mode");
        } finally {
            setTogglingHipaa(false);
        }
    };

    const handleToggleConsent = async (type: ConsentType, currentlyGranted: boolean) => {
        setTogglingConsent(type);
        try {
            await ComplianceService.recordConsent(type, !currentlyGranted, projectId);
            await loadData();
            setMessage(`Consent ${currentlyGranted ? "revoked" : "granted"} for ${type.replaceAll("_", " ")}`);
        } catch {
            setMessage("Failed to update consent");
        } finally {
            setTogglingConsent(null);
        }
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const data = await ComplianceService.exportData(projectId);
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
            await ComplianceService.deleteAccount(projectId);
            // Clear tokens and redirect
            if (globalThis.window !== undefined) {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                globalThis.window.location.href = "/";
            }
        } catch {
            setMessage("Failed to delete account");
            setDeleting(false);
            setDeleteConfirm(false);
        }
    };

    const handleGenerateUnsubscribeToken = async () => {
        try {
            const res = await ComplianceService.getUnsubscribeToken(projectId);
            setUnsubscribeToken(res.token);
            setMessage("Generated unsubscribe token");
        } catch {
            setMessage("Failed to generate unsubscribe token");
        }
    };

    const handleUnsubscribeWithToken = async () => {
        if (!unsubscribeInput.trim()) return;
        try {
            await ComplianceService.unsubscribeWithToken(unsubscribeInput.trim());
            setMessage("Unsubscribed successfully");
            setUnsubscribeInput("");
        } catch {
            setMessage("Failed to unsubscribe with token");
        }
    };

    const loadBreaches = useCallback(async () => {
        setLoadingBreaches(true);
        try {
            const rows = await ComplianceService.listBreaches(20);
            setBreaches(rows);
        } catch {
            setBreaches([]);
        } finally {
            setLoadingBreaches(false);
        }
    }, []);

    useEffect(() => { void loadBreaches(); }, [loadBreaches]);

    const handleReportBreach = async () => {
        if (!breachDescription.trim() || !breachDataAffected.trim()) return;
        setSubmittingBreach(true);
        try {
            await ComplianceService.reportBreach({
                description: breachDescription.trim(),
                dataAffected: breachDataAffected.trim(),
                severity: breachSeverity,
            });
            setBreachDescription("");
            setBreachDataAffected("");
            setMessage("Breach report submitted");
            await loadBreaches();
        } catch {
            setMessage("Failed to submit breach report");
        } finally {
            setSubmittingBreach(false);
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

            {/* ── HIPAA Status Panel ── */}
            {hipaaStatus && (
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-semibold font-display tracking-tight">HIPAA Compliance</h2>
                            <Badge
                                variant="outline"
                                className={`text-[10px] ${hipaaStatus.hipaaMode ? "border-emerald-500/30 text-emerald-400" : "border-yellow-500/30 text-yellow-400"}`}
                            >
                                {hipaaStatus.hipaaMode ? "ENABLED" : "DISABLED"}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400">45 CFR § 164.312</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                            <Label className="text-sm text-muted-foreground">
                                {hipaaStatus.hipaaMode ? "On" : "Off"}
                            </Label>
                            <Switch
                                checked={hipaaStatus.hipaaMode}
                                onCheckedChange={handleToggleHipaa}
                                disabled={togglingHipaa}
                            />
                        </div>
                    </div>
                    {hipaaStatus.hipaaMode && (
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            {[
                                { label: "HTTPS Enforced", active: hipaaStatus.controls.httpsEnforced },
                                { label: "Password Complexity", active: hipaaStatus.controls.passwordComplexity },
                                { label: "PHI Field Encryption", active: hipaaStatus.controls.phiEncryption },
                                { label: "No-Cache Headers", active: hipaaStatus.controls.noCacheHeaders },
                            ].map((ctrl) => (
                                <div key={ctrl.label} className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${ctrl.active ? "bg-emerald-400" : "bg-muted-foreground/30"}`} />
                                    <span className="text-muted-foreground">{ctrl.label}</span>
                                </div>
                            ))}
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                <span className="text-muted-foreground">
                                    Session Timeout: {hipaaStatus.controls.sessionTimeoutSeconds}s
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                <span className="text-muted-foreground">
                                    Audit Retention: {hipaaStatus.controls.auditRetentionDays} days
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                <span className="text-muted-foreground">
                                    Access Token: {hipaaStatus.controls.maxAccessTokenExpiry}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                <span className="text-muted-foreground">
                                    Refresh Token: {hipaaStatus.controls.maxRefreshTokenExpiry}
                                </span>
                            </div>
                        </div>
                    )}
                </section>
            )}

            {/* ── Consent Management ── */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-sm font-semibold font-display tracking-tight">Consent Preferences</h2>
                    <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400">GDPR Art. 7</Badge>
                </div>
                <div className="space-y-4">
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
                </div>
            </section>

            {/* ── Data Export ── */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-sm font-semibold font-display tracking-tight">Data Export</h2>
                    <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400">GDPR Art. 15 &amp; 20</Badge>
                </div>
                    <Button onClick={handleExport} disabled={exporting} variant="outline">
                        {exporting ? "Exporting..." : "Export My Data"}
                    </Button>
            </section>

            {/* ── Audit Log ── */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-sm font-semibold font-display tracking-tight">Activity Log</h2>
                    <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400">GDPR Art. 12</Badge>
                </div>
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
            </section>

            {/* ── Email Unsubscribe ── */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-sm font-semibold font-display tracking-tight">Email Unsubscribe</h2>
                    <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400">GDPR Art. 21</Badge>
                </div>
                <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={handleGenerateUnsubscribeToken}>Generate Token</Button>
                        {unsubscribeToken && (
                            <code className="text-xs p-2 rounded bg-muted/10 border border-border/40 break-all">{unsubscribeToken}</code>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <input
                            className="h-9 min-w-[280px] rounded border border-border/40 bg-transparent px-3 text-sm"
                            placeholder="Paste unsubscribe token"
                            value={unsubscribeInput}
                            onChange={(e) => setUnsubscribeInput(e.target.value)}
                        />
                        <Button variant="outline" onClick={handleUnsubscribeWithToken}>Apply Token</Button>
                    </div>
                </div>
            </section>

            {/* ── Breach Reporting ── */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-sm font-semibold font-display tracking-tight">Incident Reporting</h2>
                    <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400">GDPR Art. 33</Badge>
                </div>
                <div className="space-y-3">
                    <textarea
                        className="w-full min-h-[84px] rounded border border-border/40 bg-transparent p-3 text-sm"
                        placeholder="Describe the breach"
                        value={breachDescription}
                        onChange={(e) => setBreachDescription(e.target.value)}
                    />
                    <input
                        className="h-9 w-full rounded border border-border/40 bg-transparent px-3 text-sm"
                        placeholder="What data was affected?"
                        value={breachDataAffected}
                        onChange={(e) => setBreachDataAffected(e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                        <select
                            className="h-9 rounded border border-border/40 bg-transparent px-3 text-sm"
                            value={breachSeverity}
                            onChange={(e) => setBreachSeverity(e.target.value as "low" | "medium" | "high" | "critical")}
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>
                        <Button onClick={handleReportBreach} disabled={submittingBreach}>
                            {submittingBreach ? "Submitting..." : "Submit Breach Report"}
                        </Button>
                    </div>
                    <div className="space-y-1 pt-2">
                        <p className="text-xs text-muted-foreground">Recent incidents</p>
                        {loadingBreaches ? (
                            <p className="text-xs text-muted-foreground">Loading...</p>
                        ) : breaches.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No incidents reported.</p>
                        ) : (
                            breaches.map((item) => (
                                <div key={item.id} className="flex items-center justify-between text-xs rounded px-2 py-1 hover:bg-muted/5">
                                    <span>{item.description}</span>
                                    <span className="text-muted-foreground">{item.severity}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </section>

            {/* ── Consent History ── */}
            {history.length > 0 && (
                <section>
                    <h2 className="text-sm font-semibold font-display tracking-tight mb-4">Consent Change History</h2>
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
                                        <span className="text-xs font-mono">{entry.consentType.replaceAll("_", " ")}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground/60">
                                        {new Date(entry.createdAt).toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                </section>
            )}

            <Separator />

            {/* ── Account Deletion ── */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-sm font-semibold font-display tracking-tight text-red-400">Delete Account</h2>
                    <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-400">GDPR Art. 17</Badge>
                </div>
                    {deleteConfirm ? (
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
                    ) : (
                        <Button
                            variant="outline"
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                            onClick={() => setDeleteConfirm(true)}
                        >
                            Request Account Deletion
                        </Button>
                    )}
            </section>
            <div className="text-sm text-muted-foreground space-y-2 pt-2">
                    <p>
                        This platform provides built-in GDPR tooling — data export, consent management, audit
                        logging, and account deletion — regardless of how it is deployed.
                    </p>
                    <p>
                        <strong className="text-foreground/80">Self-hosted:</strong> You control the infrastructure
                        and bear full responsibility for GDPR/HIPAA compliance. The platform provides the tools;
                        you ensure encryption, TLS, backups, and regulatory requirements are met.
                    </p>
                    <p>
                        <strong className="text-foreground/80">Platform-hosted:</strong> The platform team manages
                        infrastructure, TLS, and DB encryption. We act as a data processor under GDPR Art. 28.
                        A Data Processing Agreement (DPA) is available on request. You remain the data controller
                        and are responsible for your end-users&apos; privacy rights.
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                        HIPAA compliance mode can be enabled per-project via the toggle above. Do not store Protected Health
                        Information on the platform-hosted service without enabling HIPAA mode. Self-hosted users must deploy on HIPAA-eligible
                        infrastructure and implement additional safeguards.
                    </p>
            </div>
        </div>
    );
}
