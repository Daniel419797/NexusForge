"use client";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface AnalysisViewProps {
    content: string;
    setContent: (val: string) => void;
    analysisType: "sentiment" | "summary" | "extract" | "moderate";
    setAnalysisType: (val: "sentiment" | "summary" | "extract" | "moderate") => void;
    onAnalyze: () => void;
    loading: boolean;
    result: string;
}

export default function AnalysisView({
    content,
    setContent,
    analysisType,
    setAnalysisType,
    onAnalyze,
    loading,
    result,
}: AnalysisViewProps) {
    return (
        <>
            <div className="grid grid-cols-4 gap-2 mb-6">
                {(["sentiment", "summary", "extract", "moderate"] as const).map((type) => (
                    <Button
                        key={type}
                        variant={analysisType === type ? "default" : "outline"}
                        className="capitalize text-xs h-9"
                        onClick={() => setAnalysisType(type)}
                    >
                        {type}
                    </Button>
                ))}
            </div>

            <div className="space-y-2">
                <Label htmlFor="content">Content to analyze</Label>
                <Textarea
                    id="content"
                    placeholder="Paste text here to analyze..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[150px] resize-y"
                />
            </div>
            <Button onClick={onAnalyze} disabled={loading || !content.trim()}>
                {loading ? "Analyzing..." : "Analyze Content"}
            </Button>

            {result && (
                <div className="mt-6 space-y-2">
                    <Label className="text-xs text-muted-foreground">Result</Label>
                    <pre className="p-4 rounded-lg bg-muted text-sm whitespace-pre-wrap overflow-x-auto text-primary/90 font-mono">
                        {result}
                    </pre>
                </div>
            )}
        </>
    );
}
