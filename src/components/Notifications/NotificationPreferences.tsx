"use client";

import { AnimatePresence, motion } from "framer-motion";

export interface NotificationPreferencesValue {
  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  deployAlerts: boolean;
  securityAlerts: boolean;
  usageAlerts: boolean;
}

export const defaultNotificationPreferences: NotificationPreferencesValue = {
  emailEnabled: true,
  pushEnabled: true,
  inAppEnabled: true,
  deployAlerts: true,
  securityAlerts: true,
  usageAlerts: true,
};

const preferenceRows: Array<{
  key: keyof NotificationPreferencesValue;
  label: string;
  description: string;
}> = [
  { key: "emailEnabled", label: "Email Notifications", description: "Receive notifications via email" },
  { key: "pushEnabled", label: "Push Notifications", description: "Receive browser/device push notifications" },
  { key: "inAppEnabled", label: "In-App Notifications", description: "Show notifications in the dashboard" },
  { key: "deployAlerts", label: "Deploy Alerts", description: "Deployment success/failure notifications" },
  { key: "securityAlerts", label: "Security Alerts", description: "Login attempts, API key rotations" },
  { key: "usageAlerts", label: "Usage Alerts", description: "Quota warnings and rate limit events" },
];

interface NotificationPreferencesProps {
  open: boolean;
  value: NotificationPreferencesValue;
  onToggle: (key: keyof NotificationPreferencesValue) => void;
}

export default function NotificationPreferences({
  open,
  value,
  onToggle,
}: NotificationPreferencesProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-8 overflow-hidden"
        >
          <h2 className="mb-4 text-sm font-semibold text-white/70">
            Notification Preferences
          </h2>
          <div className="space-y-3">
            {preferenceRows.map(({ key, label, description }) => (
              <div key={key} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-white/80">{label}</p>
                  <p className="text-xs text-white/40">{description}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-label={label}
                  aria-checked={value[key]}
                  onClick={() => onToggle(key)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    value[key] ? "bg-emerald-500" : "bg-white/10"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      value[key] ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
