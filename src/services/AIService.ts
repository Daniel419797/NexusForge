import api from "./api";
import { assert, assertNonEmptyString, assertObject, assertProjectId, unwrapDataEnvelope } from "./serviceGuards";

export interface AIUsage {
    id: string;
    projectId: string;
    tokensUsed: number;
    costEstimate: number;
    endpoint: string;
    createdAt: string;
}

export interface AIUsageSummary {
    totalTokens?: number;
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

export interface AIResponsePayload {
    text?: string;
    result?: unknown;
    message?: {
        content?: string;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

function asAIResponsePayload(value: unknown): AIResponsePayload {
    assertObject(value, "ai response");
    const message = value.message;
    if (message != null) {
        assertObject(message, "ai response.message");
        if (message.content != null) {
            assert(typeof message.content === "string", "ai response.message.content must be a string");
        }
    }
    return value as unknown as AIResponsePayload;
}

function asAIUsageSummary(value: unknown): AIUsageSummary {
    assertObject(value, "ai usage");
    return {
        totalTokens: typeof value.totalTokens === "number" ? value.totalTokens : undefined,
    };
}

const AIService = {
    // Usage
    async getUsage(projectId: string): Promise<AIUsageSummary> {
        assertProjectId(projectId);
        const { data } = await api.get("/ai/usage", {
            headers: { "x-project-id": projectId },
        });
        return asAIUsageSummary(unwrapDataEnvelope(data));
    },

    // Text generation
    async generateText(
        projectId: string,
        payload: { prompt: string; maxTokens?: number; temperature?: number },
    ): Promise<AIResponsePayload> {
        assertProjectId(projectId);
        assertNonEmptyString(payload.prompt, "prompt");
        const { data } = await api.post("/ai/generate", payload, {
            headers: { "x-project-id": projectId },
        });
        return asAIResponsePayload(unwrapDataEnvelope(data));
    },

    // Multi-turn chat
    async chatCompletion(
        projectId: string,
        payload: { messages: unknown[]; temperature?: number },
    ): Promise<AIResponsePayload> {
        assertProjectId(projectId);
        if (payload.messages !== undefined) {
            assert(Array.isArray(payload.messages), "messages must be an array");
        }
        const { data } = await api.post("/ai/chat", payload, {
            headers: { "x-project-id": projectId },
        });
        return asAIResponsePayload(unwrapDataEnvelope(data));
    },

    // Content analysis
    async analyzeContent(
        projectId: string,
        payload: { content: string; type: "sentiment" | "summary" | "extract" | "moderate" },
    ): Promise<AIResponsePayload> {
        assertProjectId(projectId);
        assertNonEmptyString(payload.content, "content");
        const { data } = await api.post("/ai/analyze", payload, {
            headers: { "x-project-id": projectId },
        });
        return asAIResponsePayload(unwrapDataEnvelope(data));
    },

    // Image analysis
    async analyzeImage(projectId: string, payload: { imageUrl: string; prompt?: string }): Promise<AIResponsePayload> {
        assertProjectId(projectId);
        assertNonEmptyString(payload.imageUrl, "imageUrl");
        const { data } = await api.post("/ai/analyze-image", payload, {
            headers: { "x-project-id": projectId },
        });
        return asAIResponsePayload(unwrapDataEnvelope(data));
    },

    // Blockchain analytics agents
    async analyzeWallet(projectId: string, payload: { address: string; network?: string }): Promise<WalletAnalysis> {
        assertProjectId(projectId);
        assertNonEmptyString(payload.address, "address");
        const { data } = await api.post("/ai/agents/analyze-wallet", payload, {
            headers: { "x-project-id": projectId },
        });
        const response = unwrapDataEnvelope(data);
        assertObject(response, "wallet analysis");
        return response as unknown as WalletAnalysis;
    },

    async analyzeTransaction(projectId: string, payload: { txHash: string; network?: string }): Promise<TransactionAnalysis> {
        assertProjectId(projectId);
        assertNonEmptyString(payload.txHash, "txHash");
        const { data } = await api.post("/ai/agents/analyze-tx", payload, {
            headers: { "x-project-id": projectId },
        });
        const response = unwrapDataEnvelope(data);
        assertObject(response, "transaction analysis");
        return response as unknown as TransactionAnalysis;
    },

    async suggestYield(projectId: string, payload: { address: string; network?: string }): Promise<YieldSuggestion> {
        assertProjectId(projectId);
        assertNonEmptyString(payload.address, "address");
        const { data } = await api.post("/ai/agents/suggest-yield", payload, {
            headers: { "x-project-id": projectId },
        });
        const response = unwrapDataEnvelope(data);
        assertObject(response, "yield suggestion");
        return response as unknown as YieldSuggestion;
    },
};

export default AIService;
