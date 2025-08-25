// app/(tabs)/downloads.tsx
import ProgressBar from "@/src/components/ProgressBar";
import { copyToDownloads } from "@/src/native/background/fileUtils";
import type { JobStatus } from "@/src/store/useDownloads";
import { useDownloads } from "@/src/store/useDownloads";
import { colors } from "@/src/theme/colors";
import * as IntentLauncher from "expo-intent-launcher";
import { useMemo } from "react";
import { Alert, FlatList, Pressable, Text, View } from "react-native";



const ACTIVE_STATUSES: ReadonlyArray<JobStatus> = [
  "queued",
  "downloading",
  "paused",
];

function fmtBytes(n?: number | null) {
  if (!n || n <= 0) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let u = 0,
    v = n;
  while (v >= 1024 && u < units.length - 1) {
    v /= 1024;
    u++;
  }
  return `${v.toFixed(u ? 1 : 0)} ${units[u]}`;
}

const statusColor: Record<
  import("@/src/store/useDownloads").JobStatus,
  string
> = {
  queued: "#8a8a8a",
  downloading: colors.brandYellow,
  paused: "#8888ff",
  canceled: "#aaaaaa",
  completed: "#2ecc71",
  failed: "#ff5252",
};

export default function DownloadsScreen() {
  const {
    jobs,
    pause,
    resume,
    cancel,
  } = useDownloads();

  const list = useMemo(() => Object.values(jobs), [jobs]);

  async function onOpen(localUri?: string, mime?: string) {
    if (!localUri) {
      Alert.alert("Open", "File not available yet.");
      return;
    }
    try {
      await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
        data: localUri,
        type: mime || "application/octet-stream",
        flags: 1,
      });
    } catch (e) {
      Alert.alert("Open", String(e));
    }
  }

  const renderItem = ({ item }: { item: (typeof list)[number] }) => {
    const pct = Math.max(0, Math.min(1, item.progress01 ?? 0));
    const total = item.sizeBytes ?? null;
    const title = item.title ?? "(untitled)";
    const meta = [item.quality, item.ext?.toUpperCase?.()].filter(Boolean).join(" • ");
    const status = item.status;

    return (
      <View
        className="rounded-2xl p-3 mb-3"
        style={{ backgroundColor: "#101010", borderWidth: 1, borderColor: "#1f1f1f" }}
      >
        {/* Header */}
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-white font-semibold flex-1 pr-2">{title}</Text>
          <Text style={{ color: statusColor[status] }}>{status.toUpperCase()}</Text>
        </View>

        {/* Meta row */}
        <Text className="text-gray-400 text-xs mb-2">
          {meta ? `${meta} • ` : ""}
          {total ? fmtBytes(total) : "size unknown"}
        </Text>

        {/* Progress */}
        <ProgressBar progress={pct} />
        <View className="flex-row justify-between mt-1">
          <Text className="text-gray-400 text-xs">{Math.round(pct * 100)}%</Text>
          {/* With RNBD we don't get speed/ETA by default; you can compute if needed */}
          <Text className="text-gray-400 text-xs">Background service active</Text>
        </View>

        {/* Controls */}
        <View className="flex-row gap-2 mt-3">
          {status === "downloading" ? (
            <Pressable
              onPress={() => pause(item.id)}
              className="px-3 py-2 rounded-xl"
              style={{ backgroundColor: "#1b1b1b" }}
            >
              <Text className="text-white">Pause</Text>
            </Pressable>
          ) : status === "paused" ? (
            <Pressable
              onPress={() => resume(item.id)}
              className="px-3 py-2 rounded-xl"
              style={{ backgroundColor: "#1b1b1b" }}
            >
              <Text className="text-white">Resume</Text>
            </Pressable>
          ) : null}

          {ACTIVE_STATUSES.includes(status) ? (
            <Pressable
              onPress={() => cancel(item.id)}
              className="px-3 py-2 rounded-xl"
              style={{ backgroundColor: "#1b1b1b" }}
            >
              <Text className="text-white">Cancel</Text>
            </Pressable>
          ) : null}

          {/* {status === "completed" ? (
            <Pressable
              onPress={() => onOpen(item.localUri, item.mime)}
              className="px-3 py-2 rounded-xl"
              style={{ backgroundColor: colors.brandYellow }}
            >
              <Text className="text-black font-semibold">Open</Text>
            </Pressable>
          ) : null} */}
          {status === "completed" ? (
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => onOpen(item.localUri, item.mime)}
                className="px-3 py-2 rounded-xl"
                style={{ backgroundColor: colors.brandYellow }}
              >
                <Text className="text-black font-semibold">Open</Text>
              </Pressable>

              <Pressable
                onPress={async () => {
                  try {
                    if (!item.localUri) throw new Error("No local file");
                    const uri = await copyToDownloads(
                      item.localUri,
                      item.fileName || "download.mp4",
                      item.mime
                    );
                    Alert.alert("Saved", `Copied to: ${uri}`);
                  } catch (e: any) {
                    Alert.alert("Save failed", String(e));
                  }
                }}
                className="px-3 py-2 rounded-xl"
                style={{ backgroundColor: "#1b1b1b" }}
              >
                <Text className="text-white">Save</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        {status === "failed" && item.error ? (
          <Text className="text-red-400 text-xs mt-2">{String(item.error)}</Text>
        ) : null}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-black px-4 pt-14">
      <Text className="text-white text-lg font-semibold mb-3">Downloads</Text>
      <FlatList
        data={list}
        renderItem={renderItem}
        keyExtractor={(it) => it.id}
        ListEmptyComponent={
          <Text className="text-gray-500 mt-10 self-center">No downloads yet.</Text>
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
  );
}
