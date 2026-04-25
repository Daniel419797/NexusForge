import api from "./api";
import { assert, assertNonEmptyString, assertProjectId, isRecord, toArray, unwrapDataEnvelope } from "./serviceGuards";

export interface AssistantMessage {
    role: "user" | "assistant";
    content: string;
    timestamp?: string;
}

export interface AssistantSummary {
    summary: string;
    generatedAt: string;
}

function requiredString(value: unknown, fieldName: string): string {
    assert(typeof value === "string" && value.trim().length > 0, `${fieldName} is required`);
    return value;
}

function asAssistantSummary(value: unknown): AssistantSummary {
    assert(isRecord(value), "Invalid assistant summary response");
    return {
        summary: requiredString(value.summary, "summary"),
        generatedAt: requiredString(value.generatedAt, "generatedAt"),
    };
}

function asAssistantMessage(value: unknown): AssistantMessage {
    assert(isRecord(value), "Invalid assistant history item");
    const role = value.role;
    assert(role === "user" || role === "assistant", "Invalid assistant role");
    return {
        role,
        content: requiredString(value.content, "content"),
        timestamp: value.timestamp == null ? undefined : requiredString(value.timestamp, "timestamp"),
    };
}

function asAssistantChatResponse(value: unknown): { reply: string; usage?: { tokensUsed: number } } {
    assert(isRecord(value), "Invalid assistant chat response");
    const usage = value.usage;
    let tokensUsed: number | undefined;
    if (usage != null) {
        assert(isRecord(usage), "Invalid assistant usage payload");
        assert(typeof usage.tokensUsed === "number" && Number.isFinite(usage.tokensUsed), "usage.tokensUsed must be a number");
        tokensUsed = usage.tokensUsed;
    }

    return {
        reply: requiredString(value.reply, "reply"),
        usage: tokensUsed == null ? undefined : { tokensUsed },
    };
}

const DashboardAssistantService = {
    async chat(projectId: string, payload: { message: string; history?: AssistantMessage[] }) {
        assertProjectId(projectId);
        assertNonEmptyString(payload.message, "message");
        const { data } = await api.post("/ai/assistant/chat", payload, {
            headers: { "x-project-id": projectId },
        });
        return asAssistantChatResponse(unwrapDataEnvelope(data));
    },

    async getSummary(projectId: string): Promise<AssistantSummary> {
        assertProjectId(projectId);
        const { data } = await api.get("/ai/assistant/summary", {
            headers: { "x-project-id": projectId },
        });
        return asAssistantSummary(unwrapDataEnvelope(data));
    },

    async getHistory(projectId: string): Promise<AssistantMessage[]> {
        assertProjectId(projectId);
        const { data } = await api.get("/ai/assistant/history", {
            headers: { "x-project-id": projectId },
        });
        return toArray(unwrapDataEnvelope(data), asAssistantMessage);
    },

    async clearHistory(projectId: string): Promise<void> {
        assertProjectId(projectId);
        await api.delete("/ai/assistant/history", {
            headers: { "x-project-id": projectId },
        });
    },
};

export default DashboardAssistantService;
