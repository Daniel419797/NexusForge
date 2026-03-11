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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateKeyDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    keyName: string;
    setKeyName: (name: string) => void;
    keyType: 'publishable' | 'secret';
    setKeyType: (t: 'publishable' | 'secret') => void;
    onCreate: (e: React.FormEvent) => void;
    creating: boolean;
}

export default function CreateKeyDialog({
    open,
    onOpenChange,
    keyName,
    setKeyName,
    keyType,
    setKeyType,
    onCreate,
    creating,
}: CreateKeyDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Generate API Key</DialogTitle>
                    <DialogDescription>
                        Create a new key for programmatic access to this project.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={onCreate} className="space-y-4 mt-2">
                    <div className="space-y-2">
                        <Label htmlFor="keyName">Key Name</Label>
                        <Input
                            id="keyName"
                            placeholder="e.g. Production Backend"
                            value={keyName}
                            onChange={(e) => setKeyName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="keyType">Key Type</Label>
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="keyType"
                                    value="secret"
                                    checked={keyType === 'secret'}
                                    onChange={() => setKeyType('secret')}
                                />
                                <span className="text-sm">Secret (full access)</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="keyType"
                                    value="publishable"
                                    checked={keyType === 'publishable'}
                                    onChange={() => setKeyType('publishable')}
                                />
                                <span className="text-sm">Publishable (restricted)</span>
                            </label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={creating}>
                            {creating ? "Generating..." : "Generate"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
