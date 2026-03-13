"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import AIService from "@/services/AIService";
import { useProjectStore } from "@/store/projectStore";

type AnalysisTool = "analyze-wallet" | "analyze-tx" | "suggest-yield";

interface ToolConfig {
    id: AnalysisTool;
    title: string;
    description: string;
    inputLabel: string;
    inputPlaceholder: string;
    icon: React.ReactNode;
}

const tools: ToolConfig[] = [
    {
        id: "analyze-wallet",
        title: "Wallet Analysis",
        description: "Get AI-powered analysis of any blockchain wallet — holdings, activity patterns, and risk assessment.",
        inputLabel: "Wallet Address",
        inputPlaceholder: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
        icon: (
            <svg aria-hidden="true" className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 013 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 013 6v3" />
            </svg>
        ),
    },
    {
        id: "analyze-tx",
        title: "Transaction Analysis",
        description: "Analyze a blockchain transaction — decode transfers, identify contracts, and assess risks.",
        inputLabel: "Transaction Hash",
        inputPlaceholder: "0xabc123...",
        icon: (
            <svg aria-hidden="true" className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
        ),
    },
    {
        id: "suggest-yield",
        title: "Yield Suggestions",
        description: "Get AI-generated DeFi yield strategies and opportunity recommendations for a wallet.",
        inputLabel: "Wallet Address",
        inputPlaceholder: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
        icon: (
            <svg aria-hidden="true" className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
            </svg>
        ),
    },
];

export default function AgentsPage() {
    const { activeProject } = useProjectStore();
    const [activeTool, setActiveTool] = useState<AnalysisTool | null>(null);
    const [inputValue, setInputValue] = useState("");
    const [network, setNetwork] = useState("ethereum");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Usage stats
    const [usage, setUsage] = useState<any>(null);
    const [usageLoading, setUsageLoading] = useState(false);

    const fetchUsage = async () => {
        if (!activeProject) return;
        setUsageLoading(true);
        try {
            const data = await AIService.getUsage(activeProject.id);
            setUsage(data);
        } catch {
            // ignore
        } finally {
            setUsageLoading(false);
        }
    };

    const handleAnalyze = async (tool: AnalysisTool) => {
        if (!activeProject || !inputValue.trim()) return;
        setLoading(true);
        setResult(null);
        setError(null);
        try {
            let response: any;
            if (tool === "analyze-wallet") {
                response = await AIService.analyzeWallet(activeProject.id, { address: inputValue.trim(), network });
                setResult(response.analysis);
            } else if (tool === "analyze-tx") {
                response = await AIService.analyzeTransaction(activeProject.id, { txHash: inputValue.trim(), network });
                setResult(response.analysis);
            } else {
                response = await AIService.suggestYield(activeProject.id, { address: inputValue.trim(), network });
                setResult(response.suggestions);
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || "Analysis failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!activeProject) {
        return <div className="text-muted-foreground text-center py-10">Select a project first.</div>;
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Usage Stats */}
            <div className="flex items-center justify-between animate-in-up">
                <div>
                    <h2 className="text-2xl font-bold font-display tracking-tight">AI Blockchain Agents</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Use AI-powered tools to analyze wallets, transactions, and discover yield opportunities.
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchUsage} disabled={usageLoading}>
                    {usageLoading ? "Loading..." : "View Usage"}
                </Button>
            </div>

            {usage && (
                <Card>
                    <CardContent className="py-4">
                        <div className="flex items-center gap-6 text-sm">
                            <div>
                                <span className="text-muted-foreground">Tokens used today:</span>{" "}
                                <span className="font-semibold">{(usage.totalTokens || 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Tool Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {tools.map((tool, index) => {
                    const isActive = activeTool === tool.id;
                    return (
                        <Card
                            key={tool.id}
                            className={`cursor-pointer card-3d animate-in-up ${isActive ? "border-primary ring-1 ring-primary/20 glow-violet" : ""}`}
                            style={{ animationDelay: `${0.1 + index * 0.08}s` }}
                            onClick={() => {
                                setActiveTool(tool.id);
                                setResult(null);
                                setError(null);
                                setInputValue("");
                            }}
                        >
                            <CardHeader>
                                <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center text-primary mb-2">
                                    {tool.icon}
                                </div>
                                <CardTitle className="text-base">{tool.title}</CardTitle>
                                <CardDescription className="text-xs">{tool.description}</CardDescription>
                            </CardHeader>
                        </Card>
                    );
                })}
            </div>

            {/* Active Tool Input */}
            {activeTool && (() => {
                const tool = tools.find((t) => t.id === activeTool)!;
                return (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">{tool.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>{tool.inputLabel}</Label>
                                    <Input
                                        placeholder={tool.inputPlaceholder}
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleAnalyze(activeTool)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Network</Label>
                                    <Input
                                        placeholder="ethereum"
                                        value={network}
                                        onChange={(e) => setNetwork(e.target.value)}
                                    />
                                </div>
                            </div>
                            <Button onClick={() => handleAnalyze(activeTool)} disabled={loading || !inputValue.trim()}>
                                {loading ? "Analyzing..." : "Run Analysis"}
                            </Button>

                            {error && (
                                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                                    {error}
                                </div>
                            )}

                            {loading && (
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-4 w-5/6" />
                                </div>
                            )}

                            {result && (
                                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                                    <pre className="whitespace-pre-wrap text-sm leading-relaxed">{result}</pre>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                );
            })()}
        </div>
    );
}
