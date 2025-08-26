// src/services/notifications/index.ts
export async function notify(title: string, body: string) {
  // Wire Expo Notifications if you want background alerts.
  // For now this is a no-op stub.
  console.log("[notify]", title, body);
}
