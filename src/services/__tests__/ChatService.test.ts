import { beforeEach, describe, expect, it, vi } from "vitest";
import ChatService from "@/services/ChatService";

vi.mock("@/services/api", () => {
    const mockGet = vi.fn();
    const mockPost = vi.fn();
    const mockDelete = vi.fn();
    return {
        default: {
            get: mockGet,
            post: mockPost,
            delete: mockDelete,
        },
    };
});

import api from "@/services/api";

const mockGet = vi.mocked(api.get);
const mockPost = vi.mocked(api.post);
const mockDelete = vi.mocked(api.delete);

const projectId = "11111111-1111-4111-8111-111111111111";
const roomId = "22222222-2222-4222-8222-222222222222";

describe("ChatService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("accepts backend direct-room type", async () => {
        mockGet.mockResolvedValue({
            data: {
                data: [
                    {
                        id: roomId,
                        name: "Support",
                        type: "direct",
                        createdAt: "2026-09-27T10:00:00.000Z",
                    },
                ],
            },
        });

        const rooms = await ChatService.getRooms(projectId);
        expect(rooms).toEqual([
            {
                id: roomId,
                name: "Support",
                type: "direct",
                createdAt: "2026-09-27T10:00:00.000Z",
            },
        ]);
    });

    it("parses the paginated message response returned by the backend", async () => {
        mockGet.mockResolvedValue({
            data: {
                data: {
                    messages: [
                        {
                            id: "33333333-3333-4333-8333-333333333333",
                            roomId,
                            senderId: "44444444-4444-4444-8444-444444444444",
                            content: "Hello from Nexus Forge",
                            type: "text",
                            createdAt: "2026-09-27T10:05:00.000Z",
                        },
                    ],
                    nextCursor: "55555555-5555-4555-8555-555555555555",
                    hasMore: true,
                },
            },
        });

        const page = await ChatService.getMessages(roomId, projectId, { limit: 50 });

        expect(mockGet).toHaveBeenCalledWith(
            "/channels/" + roomId + "/messages",
            {
                headers: { "x-project-id": projectId },
                params: { limit: 50 },
            },
        );
        expect(page.messages).toHaveLength(1);
        expect(page.messages[0].content).toBe("Hello from Nexus Forge");
        expect(page.nextCursor).toBe("55555555-5555-4555-8555-555555555555");
        expect(page.hasMore).toBe(true);
    });

    it("parses backend delete responses without inventing a success flag", async () => {
        mockDelete.mockResolvedValue({
            data: {
                data: {
                    id: roomId,
                    deleted: true,
                },
            },
        });

        const result = await ChatService.deleteRoom(roomId, projectId);

        expect(result).toEqual({ id: roomId, deleted: true });
    });

    it("creates a public chat room using the backend room vocabulary", async () => {
        mockPost.mockResolvedValue({
            data: {
                data: {
                    id: roomId,
                    name: "e-commerce-support",
                    type: "public",
                    createdAt: "2026-09-27T10:00:00.000Z",
                },
            },
        });

        const room = await ChatService.createRoom(projectId, {
            name: "e-commerce-support",
            type: "public",
        });

        expect(mockPost).toHaveBeenCalledWith(
            "/channels",
            { name: "e-commerce-support", type: "public" },
            { headers: { "x-project-id": projectId } },
        );
        expect(room.name).toBe("e-commerce-support");
    });
});
