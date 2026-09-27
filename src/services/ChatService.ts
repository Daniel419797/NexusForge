import api from "./api";
import { assert, assertNonEmptyString, assertProjectId, isRecord, toArray, unwrapDataEnvelope } from "./serviceGuards";

export interface ChatRoom {
    id: string;
    name: string;
    type: "public" | "private" | "direct";
    createdAt: string;
}

export interface ChatMessagePage {
    messages: ChatMessage[];
    nextCursor?: string;
    hasMore: boolean;
}

export interface ChatMessage {
    id: string;
    roomId: string;
    senderId: string;
    content: string;
    type: string;
    createdAt: string;
    editedAt?: string;
    sender?: {
        id: string;
        name: string | null;
        email: string;
    };
}

function requiredString(value: unknown, fieldName: string): string {
    assert(typeof value === "string" && value.trim().length > 0, `${fieldName} is required`);
    return value;
}

function asChatRoom(value: unknown): ChatRoom {
    assert(isRecord(value), "Invalid chat room response");
    const type = value.type;
    assert(type === "public" || type === "private" || type === "direct", "Invalid room type");

    return {
        id: requiredString(value.id, "room.id"),
        name: requiredString(value.name, "room.name"),
        type,
        createdAt: requiredString(value.createdAt, "room.createdAt"),
    };
}

function asChatMessage(value: unknown): ChatMessage {
    assert(isRecord(value), "Invalid chat message response");
    const sender = value.sender;
    if (sender != null) {
        assert(isRecord(sender), "Invalid message sender payload");
    }

    return {
        id: requiredString(value.id, "message.id"),
        roomId: requiredString(value.roomId, "message.roomId"),
        senderId: requiredString(value.senderId, "message.senderId"),
        content: requiredString(value.content, "message.content"),
        type: requiredString(value.type, "message.type"),
        createdAt: requiredString(value.createdAt, "message.createdAt"),
        editedAt: value.editedAt == null ? undefined : requiredString(value.editedAt, "message.editedAt"),
        sender: sender == null
            ? undefined
            : {
                id: requiredString(sender.id, "message.sender.id"),
                name: sender.name == null ? null : requiredString(sender.name, "message.sender.name"),
                email: requiredString(sender.email, "message.sender.email"),
            },
    };
}

function asDeleteResult(value: unknown): { id: string; deleted: boolean } {
    assert(isRecord(value), "Invalid delete response");
    return {
        id: requiredString(value.id, "delete.id"),
        deleted: value.deleted === true,
    };
}

function asChatMessagePage(value: unknown): ChatMessagePage {
    assert(isRecord(value), "Invalid message page response");
    return {
        messages: toArray(value.messages, asChatMessage),
        nextCursor:
            value.nextCursor == null
                ? undefined
                : requiredString(value.nextCursor, "messages.nextCursor"),
        hasMore: value.hasMore === true,
    };
}

const ChatService = {
    // Rooms
    async getRooms(projectId: string): Promise<ChatRoom[]> {
        assertProjectId(projectId);
        const { data } = await api.get("/channels", {
            headers: { "x-project-id": projectId },
        });
        return toArray(unwrapDataEnvelope(data), asChatRoom);
    },

    async createRoom(projectId: string, payload: { name: string; type: ChatRoom["type"] }): Promise<ChatRoom> {
        assertProjectId(projectId);
        assertNonEmptyString(payload.name, "name");
        assertNonEmptyString(payload.type, "type");
        const { data } = await api.post("/channels", payload, {
            headers: { "x-project-id": projectId },
        });
        return asChatRoom(unwrapDataEnvelope(data));
    },

    async getRoomDetails(roomId: string, projectId: string): Promise<ChatRoom> {
        assertProjectId(projectId);
        assertNonEmptyString(roomId, "roomId");
        const { data } = await api.get(`/channels/${roomId}`, {
            headers: { "x-project-id": projectId },
        });
        return asChatRoom(unwrapDataEnvelope(data));
    },

    async deleteRoom(roomId: string, projectId: string): Promise<{ id: string; deleted: boolean }> {
        assertProjectId(projectId);
        assertNonEmptyString(roomId, "roomId");
        const { data } = await api.delete(`/channels/${roomId}`, {
            headers: { "x-project-id": projectId },
        });
        return asDeleteResult(unwrapDataEnvelope(data));
    },

    // Messages
    async getMessages(roomId: string, projectId: string, params?: { cursor?: string; limit?: number }): Promise<ChatMessagePage> {
        assertProjectId(projectId);
        assertNonEmptyString(roomId, "roomId");
        const { data } = await api.get(`/channels/${roomId}/messages`, {
            headers: { "x-project-id": projectId },
            params,
        });
        return asChatMessagePage(unwrapDataEnvelope(data));
    },

    async sendMessage(roomId: string, projectId: string, payload: { content: string }): Promise<ChatMessage> {
        assertProjectId(projectId);
        assertNonEmptyString(roomId, "roomId");
        assertNonEmptyString(payload.content, "content");
        const { data } = await api.post(`/channels/${roomId}/messages`, payload, {
            headers: { "x-project-id": projectId },
        });
        return asChatMessage(unwrapDataEnvelope(data));
    },

    async editMessage(roomId: string, messageId: string, projectId: string, payload: { content: string }): Promise<ChatMessage> {
        assertProjectId(projectId);
        assertNonEmptyString(roomId, "roomId");
        assertNonEmptyString(messageId, "messageId");
        assertNonEmptyString(payload.content, "content");
        const { data } = await api.patch(`/channels/${roomId}/messages/${messageId}`, payload, {
            headers: { "x-project-id": projectId },
        });
        return asChatMessage(unwrapDataEnvelope(data));
    },

    async deleteMessage(roomId: string, messageId: string, projectId: string): Promise<{ id: string; deleted: boolean }> {
        assertProjectId(projectId);
        assertNonEmptyString(roomId, "roomId");
        assertNonEmptyString(messageId, "messageId");
        const { data } = await api.delete(`/channels/${roomId}/messages/${messageId}`, {
            headers: { "x-project-id": projectId },
        });
        return asDeleteResult(unwrapDataEnvelope(data));
    },
};

export default ChatService;
