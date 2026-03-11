"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCallback } from "react";

interface KeyRevealModalProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    keyValue: string | null;
}

export default function KeyRevealModal({ open, onOpenChange, keyValue }: KeyRevealModalProps) {
    const handleDownload = useCallback(() => {
        if (!keyValue) return;
        const blob = new Blob([keyValue], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'api-key.txt';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }, [keyValue]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>API Key Generated</DialogTitle>
                    <DialogDescription>
                        This is the only time the full API key will be shown. Copy or download it now.
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4">
                    <code className="w-full block p-3 rounded bg-card border border-border font-mono break-all">{keyValue || '—'}</code>
                </div>

                <DialogFooter>
                    <div className="flex items-center gap-2 w-full justify-end">
                        <Button onClick={() => { if (keyValue) navigator.clipboard.writeText(keyValue); }} disabled={!keyValue}>
                            Copy
                        </Button>
                        <Button onClick={handleDownload} disabled={!keyValue}>
                            Download
                        </Button>
                        <Button variant="ghost" onClick={() => onOpenChange(false)}>
                            Close
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
