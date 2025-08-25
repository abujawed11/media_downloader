// src/native/background/bootstrap.ts
import { PermissionsAndroid, Platform } from "react-native";
import RNBackgroundDownloader from "react-native-background-downloader";

export async function ensureNotifPermission() {
  if (Platform.OS !== "android") return;
  // Android 13+ asks for POST_NOTIFICATIONS at runtime
  if ((Platform.Version as number) >= 33) {
    try {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
    } catch { /* ignore */ }
  }
}

/**
 * Re-attach background tasks after hot reload/app restart,
 * so you continue getting progress/done/error callbacks.
 */
export async function reattachExistingDownloads({
  onProgress,
  onDone,
  onError,
}: {
  onProgress: (id: string, progress01: number) => void;
  onDone: (id: string, filePath: string) => void;
  onError: (id: string, err: any) => void;
}) {
  const tasks = await RNBackgroundDownloader.checkForExistingDownloads();
  tasks.forEach((task: any) => {
    const { id, destination } = task;
    task
      .progress((p: number) => onProgress(id, p))
      .done(() => onDone(id, destination))
      .error((e: any) => onError(id, e));
  });
}
