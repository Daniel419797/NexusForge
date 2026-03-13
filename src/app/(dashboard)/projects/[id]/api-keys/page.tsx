"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import ApiKeyService, { type ApiKey } from "@/services/ApiKeyService";
import KeyRow from "@/components/ApiKeys/KeyRow";
import CreateKeyDialog from "@/components/ApiKeys/CreateKeyDialog";
import KeyRevealModal from "@/components/ApiKeys/KeyRevealModal";
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function ApiKeysPage() {
    const params = useParams();
    const projectId = params.id as string;
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [createOpen, setCreateOpen] = useState(false);
    const [newKeyName, setNewKeyName] = useState("");
    const [newKeyType, setNewKeyType] = useState<'publishable' | 'secret'>('secret');
    const [creating, setCreating] = useState(false);
    const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
    const [revealOpen, setRevealOpen] = useState(false);
    const [pendingRotateId, setPendingRotateId] = useState<string | null>(null);
    const [pendingRevokeId, setPendingRevokeId] = useState<string | null>(null);
    const [rotateConfirmOpen, setRotateConfirmOpen] = useState(false);
    const [revokeConfirmOpen, setRevokeConfirmOpen] = useState(false);

    const fetchKeys = useCallback(async () => {
        try {
            const data = await ApiKeyService.list(projectId);
            setKeys(data);
        } catch {
            // handle error
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchKeys();
    }, [fetchKeys]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newKeyName.trim()) return;
        setCreating(true);
        try {
            const result = await ApiKeyService.create(projectId, { name: newKeyName.trim(), type: newKeyType });
            const fullKey = result.key || result.apiKey || null;
            setNewKeyValue(fullKey);
            setRevealOpen(true);
            setNewKeyName("");
            fetchKeys();
        } catch {
            // handle error
        } finally {
            setCreating(false);
        }
    };

    const handleRevoke = async (keyId: string) => {
        try {
            await ApiKeyService.revoke(keyId, projectId);
            fetchKeys();
        } catch {
            // handle error
        }
    };

    const handleRotate = async (keyId: string) => {
        try {
            const result = await ApiKeyService.rotate(keyId, projectId);
            const fullKey = result.newKey?.key || result.key || null;
            setNewKeyValue(fullKey);
            setRevealOpen(true);
            fetchKeys();
        } catch {
            // handle error
        }
    };

    const requestRotate = (keyId: string) => {
        setPendingRotateId(keyId);
        setRotateConfirmOpen(true);
    };

    const requestRevoke = (keyId: string) => {
        setPendingRevokeId(keyId);
        setRevokeConfirmOpen(true);
    };

    return (
        <div className="max-w-3xl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold">API Keys</h2>
                    <p className="text-sm text-muted-foreground">
                        Generate and manage keys for programmatic access.
                    </p>
                </div>
                <Button onClick={() => setCreateOpen(true)} size="sm">
                    <svg aria-hidden="true" className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Generate Key
                </Button>
            </div>

            {/* New key reveal banner */}
            {newKeyValue && (
                <Card className="mb-6 border-primary/30 bg-primary/5">
                    <CardContent className="pt-4">
                        <p className="text-sm font-medium text-primary mb-2">
                            🔑 New API Key Generated — Copy it now, it won&apos;t be shown again.
                        </p>
                        <div className="flex items-center gap-2">
                            <code className="flex-1 p-2.5 rounded-lg bg-card border border-border text-sm font-mono break-all">
                                {newKeyValue}
                            </code>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    navigator.clipboard.writeText(newKeyValue);
                                }}
                            >
                                Copy
                            </Button>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 text-xs"
                            onClick={() => setNewKeyValue(null)}
                        >
                            Dismiss
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Loading */}
            {loading && (
                <div className="space-y-3">
                    {[1, 2].map((i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-xl" />
                    ))}
                </div>
            )}

            {/* Keys list */}
            {!loading && keys.length === 0 && (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-sm text-muted-foreground">No API keys yet. Generate one to get started.</p>
                    </CardContent>
                </Card>
            )}

            {!loading && keys.length > 0 && (
                <div className="space-y-3">
                    {keys.map((key) => (
                        <KeyRow
                            key={key.id}
                            apiKey={key}
                            onRotateRequest={requestRotate}
                            onRevokeRequest={requestRevoke}
                        />
                    ))}
                </div>
            )}

            {/* Create dialog */}
            <CreateKeyDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                keyName={newKeyName}
                setKeyName={setNewKeyName}
                keyType={newKeyType}
                setKeyType={setNewKeyType}
                onCreate={handleCreate}
                creating={creating}
            />

            {/* Reveal modal for newly created/rotated keys */}
            <React.Suspense>
                <KeyRevealModal open={revealOpen} onOpenChange={setRevealOpen} keyValue={newKeyValue} />
            </React.Suspense>

            {/* Page-level confirm dialogs for rotate/revoke */}
            <Dialog open={rotateConfirmOpen} onOpenChange={setRotateConfirmOpen}>
                <DialogContent>
                    <div className="flex items-start gap-4 p-4 rounded-md bg-red-50 border border-red-100">
                        <svg className="w-6 h-6 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 5.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13z" />
                        </svg>
                        <div>
                            <h3 className="text-sm font-semibold text-red-700">Rotate API Key</h3>
                            <p className="text-sm text-red-600 mt-1">Rotating will immediately revoke the current key and generate a new one. This action cannot be undone.</p>
                        </div>
                    </div>

                    <div className="mt-4 flex gap-2 justify-end">
                        <Button
                            onClick={async () => {
                                setRotateConfirmOpen(false);
                                if (pendingRotateId) {
                                    await handleRotate(pendingRotateId);
                                }
                                setPendingRotateId(null);
                            }}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
                            Confirm Rotate
                        </Button>
                        <Button variant="ghost" onClick={() => setRotateConfirmOpen(false)}>Cancel</Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={revokeConfirmOpen} onOpenChange={setRevokeConfirmOpen}>
                <DialogContent>
                    <div className="flex items-start gap-4 p-4 rounded-md bg-red-50 border border-red-100">
                        <svg className="w-6 h-6 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 5.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13z" />
                        </svg>
                        <div>
                            <h3 className="text-sm font-semibold text-red-700">Revoke API Key</h3>
                            <p className="text-sm text-red-600 mt-1">Revoking will immediately disable this key. This action cannot be undone.</p>
                        </div>
                    </div>

                    <div className="mt-4 flex gap-2 justify-end">
                        <Button
                            onClick={async () => {
                                setRevokeConfirmOpen(false);
                                if (pendingRevokeId) {
                                    await handleRevoke(pendingRevokeId);
                                }
                                setPendingRevokeId(null);
                            }}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
                            Confirm Revoke
                        </Button>
                        <Button variant="ghost" onClick={() => setRevokeConfirmOpen(false)}>Cancel</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
