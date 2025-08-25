// app/_layout.tsx
import { ensureNotifPermission, reattachExistingDownloads } from "@/src/native/background/bootstrap";
import { useDownloads } from "@/src/store/useDownloads";
import { Slot } from "expo-router";
import { useEffect } from "react";
import { StatusBar, View } from "react-native";
import "../global.css";

export default function RootLayout() {
  useEffect(() => {
    // Ask for POST_NOTIFICATIONS on Android 13+
    ensureNotifPermission();

    // Re-attach any background tasks if the app was restarted
    reattachExistingDownloads({
      onProgress: (id, p01) => useDownloads.getState().updateProgress(id, p01),
      onDone: (id, localPath) => useDownloads.getState().markCompleted(id, localPath),
      onError: (id, e) => useDownloads.getState().markFailed(id, String(e)),
    });
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <StatusBar barStyle="light-content" />
      <Slot />
    </View>
  );
}
