"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import ElectricRippleButton from "@/components/Dashboard/ElectricRippleButton";
import ScrollReveal from "@/components/Dashboard/ScrollReveal";
import PromptInput from "@/components/AI/PromptInput";
import AnalysisView from "@/components/AI/AnalysisView";
import ChatPanel from "@/components/AI/ChatPanel";
import { useProjectStore } from "@/store/projectStore";
import AIService from "@/services/AIService";

export default function AIPage() {
    const { activeProject } = useProjectStore();
    const [temperature, setTemperature] = useState([0.7]);
    const [activeTab, setActiveTab] = useState<"text" | "chat" | "analysis">("text");

    // Text Gen state
    const [textPrompt, setTextPrompt] = useState("");
    const [textResult, setTextResult] = useState("");
    const [loadingText, setLoadingText] = useState(false);

    // Chat state
    const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [loadingChat, setLoadingChat] = useState(false);

    // Analysis state
    const [analysisContent, setAnalysisContent] = useState("");
    const [analysisType, setAnalysisType] = useState<"sentiment" | "summary" | "extract" | "moderate">("summary");
    const [analysisResult, setAnalysisResult] = useState("");
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);

    if (!activeProject) {
        return <div className="text-white/50 text-center py-10">Select a project to use AI features.</div>;
    }

    const handleTextGen = async () => {
        if (!textPrompt.trim()) return;
        setLoadingText(true);
        setTextResult("");
        try {
            const resp = await AIService.generateText(activeProject.id, { prompt: textPrompt, temperature: temperature[0] });
            setTextResult(resp.text || resp.message || JSON.stringify(resp, null, 2));
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setTextResult(e.response?.data?.message || "Generation failed.");
        } finally { setLoadingText(false); }
    };

    const handleChat = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim()) return;
        const newMsg = { role: "user", content: chatInput.trim() };
        const updatedMsgs = [...chatMessages, newMsg];
        setChatMessages(updatedMsgs);
        setChatInput("");
        setLoadingChat(true);
        try {
            const resp = await AIService.chatCompletion(activeProject.id, { messages: updatedMsgs, temperature: temperature[0] });
            setChatMessages([...updatedMsgs, { role: "assistant", content: resp.message?.content || resp.text || "No response" }]);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setChatMessages([...updatedMsgs, { role: "assistant", content: e.response?.data?.message || "Chat failed." }]);
        } finally { setLoadingChat(false); }
    };

    const handleAnalysis = async () => {
        if (!analysisContent.trim()) return;
        setLoadingAnalysis(true);
        setAnalysisResult("");
        try {
            const resp = await AIService.analyzeContent(activeProject.id, { content: analysisContent, type: analysisType });
            setAnalysisResult(typeof resp.result === 'string' ? resp.result : JSON.stringify(resp.result || resp, null, 2));
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setAnalysisResult(e.response?.data?.message || "Analysis failed.");
        } finally { setLoadingAnalysis(false); }
    };

    const tabItems = [
        { key: "text" as const, label: "Text Generation" },
        { key: "chat" as const, label: "Chat Completion" },
        { key: "analysis" as const, label: "Content Analysis" },
    ];

    return (
        <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Settings Sidebar */}
                <ScrollReveal direction="left" className="col-span-1">
                    <div>
                        <h3 className="text-sm font-semibold text-white mb-4">Global Settings</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <Label className="text-xs text-white/60">Temperature</Label>
                                <span className="text-xs text-white/40">{temperature[0]}</span>
                            </div>
                            <Slider value={temperature} onValueChange={setTemperature} max={2} step={0.1} />
                            <p className="text-[10px] text-white/40">
                                Higher values make output more random, lower values make it more focused.
                            </p>
                        </div>
                    </div>
                </ScrollReveal>

                {/* Main Playground */}
                <ScrollReveal direction="up" delay={0.1} className="col-span-1 lg:col-span-3">
                    {/* Tab switcher */}
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit mb-6">
                        {tabItems.map((t) => (
                            <button
                                key={t.key}
                                onClick={() => setActiveTab(t.key)}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                                    activeTab === t.key
                                        ? "bg-white/[0.08] text-white"
                                        : "text-white/50 hover:text-white/70"
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {activeTab === "text" && (
                        <div>
                            <PromptInput
                                prompt={textPrompt}
                                setPrompt={setTextPrompt}
                                onGenerate={handleTextGen}
                                loading={loadingText}
                                result={textResult}
                            />
                        </div>
                    )}

                    {activeTab === "chat" && (
                        <ChatPanel
                            messages={chatMessages}
                            input={chatInput}
                            onInputChange={setChatInput}
                            onSubmit={handleChat}
                            loading={loadingChat}
                        />
                    )}

                    {activeTab === "analysis" && (
                        <div>
                            <AnalysisView
                                content={analysisContent}
                                setContent={setAnalysisContent}
                                analysisType={analysisType}
                                setAnalysisType={setAnalysisType}
                                onAnalyze={handleAnalysis}
                                loading={loadingAnalysis}
                                result={analysisResult}
                            />
                        </div>
                    )}
                </ScrollReveal>
            </div>
        </div>
    );
}
