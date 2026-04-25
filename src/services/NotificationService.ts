import api from "./api";
import { assert, assertNonEmptyString, isRecord, toArray, unwrapDataEnvelope } from "./serviceGuards";

export interface Notification {
    id: string;
    type: string;
    title: string;
    body: string | null;
    read: boolean;
    createdAt: string;
    metadata?: Record<string, unknown>;
}

export interface PushDevice {
    id: string;
    token: string;
    platform: string;
    createdAt: string;
}

function requiredString(value: unknown, fieldName: string): string {
    assert(typeof value === "string" && value.trim().length > 0, `${fieldName} is required`);
    return value;
}

function asPushDevice(value: unknown): PushDevice {
    assert(isRecord(value), "Invalid push device response");
    return {
        id: requiredString(value.id, "device.id"),
        token: requiredString(value.token, "device.token"),
        platform: requiredString(value.platform, "device.platform"),
        createdAt: requiredString(value.createdAt, "device.createdAt"),
    };
}

function asNotification(value: unknown): Notification {
    assert(isRecord(value), "Invalid notification item");
    return {
        id: requiredString(value.id, "notification.id"),
        type: requiredString(value.type, "notification.type"),
        title: requiredString(value.title, "notification.title"),
        body: value.body == null ? null : requiredString(value.body, "notification.body"),
        read: Boolean(value.read),
        createdAt: requiredString(value.createdAt, "notification.createdAt"),
        metadata: isRecord(value.metadata) ? value.metadata : undefined,
    };
}

function asUnreadCount(value: unknown): number {
    assert(isRecord(value), "Invalid unread-count response");
    const count = value.count;
    if (typeof count === "number" && Number.isFinite(count)) return count;
    if (typeof count === "string" && count.trim().length > 0) return Number(count);
    return 0;
}

const NotificationService = {
    async getNotifications(params?: { limit?: number; cursor?: string; unreadOnly?: boolean }): Promise<Notification[]> {
        const { data } = await api.get("/notifications", { params });
        return toArray(unwrapDataEnvelope(data), asNotification);
    },

    async getUnreadCount(): Promise<number> {
        const { data } = await api.get("/notifications/unread-count");
        return asUnreadCount(unwrapDataEnvelope(data));
    },

    async markAsRead(id: string): Promise<Notification> {
        assertNonEmptyString(id, "id");
        const { data } = await api.patch(`/notifications/${id}/read`);
        return asNotification(unwrapDataEnvelope(data));
    },

    async markAllAsRead(): Promise<{ success: boolean; updated?: number }> {
        const { data } = await api.post("/notifications/read-all");
        const payload = unwrapDataEnvelope(data);
        assert(isRecord(payload), "Invalid mark-all-read response");
        return {
            success: typeof payload.success === "boolean" ? payload.success : true,
            updated: typeof payload.updated === "number" && Number.isFinite(payload.updated) ? payload.updated : undefined,
        };
    },

    // Push device management
    async getDevices(): Promise<PushDevice[]> {
        const { data } = await api.get("/notifications/devices");
        return toArray(unwrapDataEnvelope(data), asPushDevice);
    },

    async registerDevice(payload: { token: string; platform: string }): Promise<PushDevice> {
        assertNonEmptyString(payload.token, "token");
        assertNonEmptyString(payload.platform, "platform");
        const { data } = await api.post("/notifications/devices", payload);
        return asPushDevice(unwrapDataEnvelope(data));
    },

    async removeDevice(deviceId: string): Promise<void> {
        assertNonEmptyString(deviceId, "deviceId");
        await api.delete(`/notifications/devices/${deviceId}`);
    },
};

export default NotificationService;
