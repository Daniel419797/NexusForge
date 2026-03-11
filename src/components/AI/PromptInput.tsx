"use client";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface PromptInputProps {
    prompt: string;
    setPrompt: (val: string) => void;
    onGenerate: () => void;
    loading: boolean;
    result: string;
}

export default function PromptInput({
    prompt,
    setPrompt,
    onGenerate,
    loading,
    result,
}: PromptInputProps) {
    return (
        <>
            <div className="space-y-2">
                <Label htmlFor="prompt">Prompt</Label>
                <Textarea
                    id="prompt"
                    placeholder="Write a tagline for a modern SaaS platform..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[120px] resize-y"
                />
            </div>
            <Button onClick={onGenerate} disabled={loading || !prompt.trim()}>
                {loading ? "Generating..." : "Generate"}
            </Button>

            {result && (
                <div className="mt-6">
                    <Label className="text-xs text-muted-foreground mb-2 block">Result</Label>
                    <div className="p-4 rounded-lg bg-muted text-sm whitespace-pre-wrap font-mono">
                        {result}
                    </div>
                </div>
            )}
        </>
    );
}
