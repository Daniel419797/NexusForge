import api from "./api";

export interface AssistantMessage {
    role: "user" | "assistant";
    content: string;
    timestamp?: string;
}

export interface AssistantSummary {
    summary: string;
    generatedAt: string;
}

const DashboardAssistantService = {
    async chat(projectId: string, payload: { message: string; history?: AssistantMessage[] }) {
        const { data } = await api.post("/ai/assistant/chat", payload, {
            headers: { "x-project-id": projectId },
        });
        return data.data as { reply: string; usage?: { tokensUsed: number } };
    },

    async getSummary(projectId: string): Promise<AssistantSummary> {
        const { data } = await api.get("/ai/assistant/summary", {
            headers: { "x-project-id": projectId },
        });
        return data.data;
    },

    async getHistory(projectId: string): Promise<AssistantMessage[]> {
        const { data } = await api.get("/ai/assistant/history", {
            headers: { "x-project-id": projectId },
        });
        return data.data || [];
    },

    async clearHistory(projectId: string): Promise<void> {
        await api.delete("/ai/assistant/history", {
            headers: { "x-project-id": projectId },
        });
    },
};

export default DashboardAssistantService;
