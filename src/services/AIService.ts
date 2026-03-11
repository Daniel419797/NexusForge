import api from "./api";

export interface AIUsage {
    id: string;
    projectId: string;
    tokensUsed: number;
    costEstimate: number;
    endpoint: string;
    createdAt: string;
}

export interface WalletAnalysis {
    address: string;
    analysis: string;
    riskScore?: number;
    usage: { tokensUsed: number };
}

export interface TransactionAnalysis {
    txHash: string;
    analysis: string;
    usage: { tokensUsed: number };
}

export interface YieldSuggestion {
    address: string;
    suggestions: string;
    usage: { tokensUsed: number };
}

const AIService = {
    // Usage
    async getUsage(projectId: string) {
        const { data } = await api.get("/ai/usage", {
            headers: { "x-project-id": projectId },
        });
        return data.data;
    },

    // Text generation
    async generateText(projectId: string, payload: { prompt: string; maxTokens?: number; temperature?: number }) {
        const { data } = await api.post("/ai/generate", payload, {
            headers: { "x-project-id": projectId },
        });
        return data.data;
    },

    // Multi-turn chat
    async chatCompletion(projectId: string, payload: { messages: any[]; temperature?: number }) {
        const { data } = await api.post("/ai/chat", payload, {
            headers: { "x-project-id": projectId },
        });
        return data.data;
    },

    // Content analysis
    async analyzeContent(projectId: string, payload: { content: string; type: "sentiment" | "summary" | "extract" | "moderate" }) {
        const { data } = await api.post("/ai/analyze", payload, {
            headers: { "x-project-id": projectId },
        });
        return data.data;
    },

    // Image analysis
    async analyzeImage(projectId: string, payload: { imageUrl: string; prompt?: string }) {
        const { data } = await api.post("/ai/analyze-image", payload, {
            headers: { "x-project-id": projectId },
        });
        return data.data;
    },

    // Blockchain analytics agents
    async analyzeWallet(projectId: string, payload: { address: string; network?: string }): Promise<WalletAnalysis> {
        const { data } = await api.post("/ai/agents/analyze-wallet", payload, {
            headers: { "x-project-id": projectId },
        });
        return data.data;
    },

    async analyzeTransaction(projectId: string, payload: { txHash: string; network?: string }): Promise<TransactionAnalysis> {
        const { data } = await api.post("/ai/agents/analyze-tx", payload, {
            headers: { "x-project-id": projectId },
        });
        return data.data;
    },

    async suggestYield(projectId: string, payload: { address: string; network?: string }): Promise<YieldSuggestion> {
        const { data } = await api.post("/ai/agents/suggest-yield", payload, {
            headers: { "x-project-id": projectId },
        });
        return data.data;
    },
};

export default AIService;
