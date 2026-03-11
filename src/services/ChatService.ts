import api from "./api";

export interface ChatRoom {
    id: string;
    name: string;
    type: "public" | "private" | "dm";
    createdAt: string;
}

export interface ChatMessage {
    id: string;
    roomId: string;
    senderId: string;
    content: string;
    type: string;
    createdAt: string;
    updatedAt?: string;
    sender?: {
        id: string;
        name: string | null;
        email: string;
    };
}

const ChatService = {
    // Rooms
    async getRooms(projectId: string) {
        const { data } = await api.get("/channels", {
            headers: { "x-project-id": projectId },
        });
        return data.data;
    },

    async createRoom(projectId: string, payload: { name: string; type: string }) {
        const { data } = await api.post("/channels", payload, {
            headers: { "x-project-id": projectId },
        });
        return data.data;
    },

    async getRoomDetails(roomId: string, projectId: string) {
        const { data } = await api.get(`/channels/${roomId}`, {
            headers: { "x-project-id": projectId },
        });
        return data.data;
    },

    // Messages
    async getMessages(roomId: string, projectId: string, params?: { cursor?: string; limit?: number }) {
        const { data } = await api.get(`/channels/${roomId}/messages`, {
            headers: { "x-project-id": projectId },
            params,
        });
        return data.data;
    },

    async sendMessage(roomId: string, projectId: string, payload: { content: string }) {
        const { data } = await api.post(`/channels/${roomId}/messages`, payload, {
            headers: { "x-project-id": projectId },
        });
        return data.data;
    },

    async deleteMessage(roomId: string, messageId: string, projectId: string) {
        const { data } = await api.delete(`/channels/${roomId}/messages/${messageId}`, {
            headers: { "x-project-id": projectId },
        });
        return data.data;
    },
};

export default ChatService;
