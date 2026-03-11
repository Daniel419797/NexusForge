"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PluginService from "@/services/PluginService";
import { useProjectStore } from "@/store/projectStore";

interface IdeaSubmissionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function IdeaSubmissionDialog({ open, onOpenChange }: IdeaSubmissionDialogProps) {
    const { activeProject } = useProjectStore();
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("general");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [error, setError] = useState("");

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            // Reset state when closing
            setTitle("");
            setCategory("general");
            setDescription("");
            setSuccessMessage("");
            setError("");
        }
        onOpenChange(newOpen);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccessMessage("");

        if (!activeProject) {
            setError("No active project selected.");
            return;
        }

        if (title.length < 3) {
            setError("Title must be at least 3 characters.");
            return;
        }

        if (description.length < 10) {
            setError("Description must be at least 10 characters.");
            return;
        }

        setIsSubmitting(true);
        try {
            await PluginService.submitIdea(activeProject.id, {
                title,
                category,
                description,
            });
            // A small hack: the API expects { title, description, category }
            // Let's ensure PluginService supports this format
            setSuccessMessage("Idea submitted successfully! A GitHub issue has been created.");
            setTimeout(() => {
                handleOpenChange(false);
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to submit idea.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Submit Plugin Idea</DialogTitle>
                        <DialogDescription>
                            Have an idea for a new plugin? Submit it here, and our maintainers will review the request on GitHub.
                        </DialogDescription>
                    </DialogHeader>

                    {successMessage ? (
                        <div className="py-6 text-center text-green-600 font-medium">
                            {successMessage}
                        </div>
                    ) : (
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    placeholder="e.g. Stripe Integration"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="category">Category</Label>
                                <Select value={category} onValueChange={setCategory} disabled={isSubmitting}>
                                    <SelectTrigger id="category">
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="general">General</SelectItem>
                                        <SelectItem value="payments">Payments</SelectItem>
                                        <SelectItem value="web3">Web3 / Blockchain</SelectItem>
                                        <SelectItem value="ai">AI Agents</SelectItem>
                                        <SelectItem value="communication">Communication</SelectItem>
                                        <SelectItem value="analytics">Analytics</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Description & Use Case</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Describe your idea and how it would be used..."
                                    className="min-h-[100px]"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    disabled={isSubmitting}
                                />
                            </div>

                            {error && <p className="text-sm text-destructive">{error}</p>}
                        </div>
                    )}

                    {!successMessage && (
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Submitting..." : "Submit Idea"}
                            </Button>
                        </DialogFooter>
                    )}
                </form>
            </DialogContent>
        </Dialog>
    );
}
