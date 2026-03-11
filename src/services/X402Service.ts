import api from "./api";

export interface X402Config {
    enabled: boolean;
    walletAddress?: string;
    amount?: string;
    currency?: string;
    chain?: string;
    settings?: Record<string, any>;
}

const X402Service = {
    async getConfig(projectId: string): Promise<X402Config | null> {
        const { data } = await api.get("/x402/config", {
            headers: { "x-project-id": projectId },
        });
        return data.data || null;
    },

    async updateConfig(projectId: string, payload: Partial<X402Config>): Promise<X402Config> {
        const { data } = await api.put("/x402/config", payload, {
            headers: { "x-project-id": projectId },
        });
        return data.data;
    },

    async verifyPayment(projectId: string, payload: { txHash: string; chain?: string }) {
        const { data } = await api.post("/x402/verify", payload, {
            headers: { "x-project-id": projectId },
        });
        return data.data;
    },
};

export default X402Service;
