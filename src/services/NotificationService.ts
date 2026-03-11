import api from "./api";

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

const NotificationService = {
    async getNotifications(params?: { limit?: number; cursor?: string; unreadOnly?: boolean }) {
        const { data } = await api.get("/notifications", { params });
        return data.data;
    },

    async getUnreadCount() {
        const { data } = await api.get("/notifications/unread-count");
        return data.data.count as number;
    },

    async markAsRead(id: string) {
        const { data } = await api.patch(`/notifications/${id}/read`);
        return data.data;
    },

    async markAllAsRead() {
        const { data } = await api.post("/notifications/read-all");
        return data.data;
    },

    // Push device management
    async getDevices(): Promise<PushDevice[]> {
        const { data } = await api.get("/notifications/devices");
        return data.data || [];
    },

    async registerDevice(payload: { token: string; platform: string }): Promise<PushDevice> {
        const { data } = await api.post("/notifications/devices", payload);
        return data.data;
    },

    async removeDevice(deviceId: string): Promise<void> {
        await api.delete(`/notifications/devices/${deviceId}`);
    },
};

export default NotificationService;
