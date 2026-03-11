"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ApiKey } from "@/services/ApiKeyService";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface KeyRowProps {
    apiKey: ApiKey;
    onRotateRequest: (id: string) => void;
    onRevokeRequest: (id: string) => void;
}

export default function KeyRow({ apiKey, onRotateRequest, onRevokeRequest }: KeyRowProps) {
    const [infoOpen, setInfoOpen] = useState(false);
    const handleShow = () => setInfoOpen(true);
    return (
        <Card>
            <CardContent className="flex items-center justify-between py-4">
                <div>
                    <p className="font-medium text-sm">{apiKey.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        <code className="font-mono">{apiKey.prefix}••••••••</code>
                        {" · "}
                        Created{" "}
                        {new Date(apiKey.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                        })}
                        {apiKey.expiresAt && (
                            <>
                                {" · Expires "}
                                {new Date(apiKey.expiresAt).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                })}
                            </>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={handleShow}
                    >
                        Show
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => onRotateRequest(apiKey.id)}
                    >
                        Rotate
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-destructive hover:text-destructive"
                        onClick={() => onRevokeRequest(apiKey.id)}
                    >
                        Revoke
                    </Button>
                </div>
            </CardContent>
            <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Full key not available</DialogTitle>
                        <DialogDescription>
                            The full API key is only shown at creation or rotation. For security we do not store full keys on the server.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 flex gap-2 justify-end">
                        <Button onClick={() => setInfoOpen(false)} variant="ghost">Close</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
