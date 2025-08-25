// app/(tabs)/downloads.tsx
import { useEffect, useMemo } from "react";
import { Alert, FlatList, Linking, Pressable, Text, View } from "react-native";
import ProgressBar from "../../src/components/ProgressBar";
import {
  Job,
  cancelJob,
  listJobs,
  pauseJob,
  resumeJob,
} from "../../src/services/api/media";
import type { DownloadStatus, Item } from "../../src/store/useDownloads";
import { useDownloads } from "../../src/store/useDownloads";
import { colors } from "../../src/theme/colors";

// ---------- helpers ----------
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

function fmtSpeed(bps?: number | null) {
  if (!bps || bps <= 0) return "—";
  return `${fmtBytes(bps)}/s`;
}

function fmtEta(sec?: number | null) {
  if (!sec || sec <= 0) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m ? `${m}m ${s}s` : `${s}s`;
}

// Map backend job status -> store status (prevents TS mismatches)
const mapJobStatusToStore = (s: Job["status"]): DownloadStatus => {
  switch (s) {
    case "done":
      return "completed";
    case "error":
      return "failed";
    case "merging":
      return "downloading"; // show as active
    default:
      // queued | downloading | paused | canceled
      return s as DownloadStatus;
  }
};

// Colors for STORE statuses
const statusColor: Record<DownloadStatus, string> = {
  queued: "#8a8a8a",
  downloading: colors.brandYellow,
  paused: "#8888ff",
  canceled: "#aaaaaa",
  completed: "#2ecc71",
  failed: "#ff5252",
};

export default function DownloadsScreen() {
  const downloads = useDownloads();
  const items = (downloads.items ?? []) as Item[];

  // Poll server only while something is active
  const activeIds = useMemo(
    () =>
      items
        .filter((x) =>
          (["queued", "downloading", "paused"] as DownloadStatus[]).includes(
            x.status
          )
        )
        .map((x) => x.id),
    [items]
  );

  useEffect(() => {
    let stopped = false;

    async function tick() {
      try {
        const serverJobs = await listJobs();
        if (stopped) return;

        // Merge server state into local store
        for (const j of serverJobs) {
          downloads.update(j.id, {
            id: j.id,
            progress: j.progress ?? 0,
            status: mapJobStatusToStore(j.status),
            speed_bps: j.speed_bps ?? 0,
            eta_seconds: j.eta_seconds ?? 0,
            downloaded_bytes: j.downloaded_bytes ?? 0,
            total_bytes: j.total_bytes ?? null,
            filename: j.filename ?? null,
            error: j.error ?? null,
          });
        }
      } catch {
        // swallow transient polling errors
      }
      if (!stopped) setTimeout(tick, 1000);
    }

    if (activeIds.length) {
      tick();
      return () => {
        stopped = true;
      };
    }
  }, [activeIds.length, downloads]);

  // ---------- actions ----------
  async function onPause(id: string) {
    try {
      const j = await pauseJob(id);
      downloads.update(id, { status: mapJobStatusToStore(j.status) });
    } catch (e: any) {
      Alert.alert("Pause failed", e?.message ?? "Unknown error");
    }
  }
  async function onResume(id: string) {
    try {
      const j = await resumeJob(id);
      downloads.update(id, { status: mapJobStatusToStore(j.status) });
    } catch (e: any) {
      Alert.alert("Resume failed", e?.message ?? "Unknown error");
    }
  }
  async function onCancel(id: string) {
    try {
      const j = await cancelJob(id);
      downloads.update(id, { status: mapJobStatusToStore(j.status) });
    } catch (e: any) {
      Alert.alert("Cancel failed", e?.message ?? "Unknown error");
    }
  }
  async function onOpen(it: Item) {
    if (it.filename) {
      try {
        await Linking.openURL(it.filename);
      } catch {
        Alert.alert("Open file", it.filename);
      }
    }
  }

  const renderItem = ({ item }: { item: Item }) => {
    const pct = Math.max(0, Math.min(1, item.progress ?? 0));
    const status = item.status as DownloadStatus;
    const total = item.total_bytes ?? item.sizeBytes ?? null;
    const title = item.title ?? "(untitled)";
    const meta = [item.quality, item.ext?.toUpperCase?.()].filter(Boolean).join(" • ");

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
          <Text className="text-gray-400 text-xs">
            {fmtSpeed(item.speed_bps)} • ETA {fmtEta(item.eta_seconds)}
          </Text>
        </View>

        {/* Controls */}
        <View className="flex-row gap-2 mt-3">
          {status === "downloading" ? (
            <Pressable
              onPress={() => onPause(item.id)}
              className="px-3 py-2 rounded-xl"
              style={{ backgroundColor: "#1b1b1b" }}
            >
              <Text className="text-white">Pause</Text>
            </Pressable>
          ) : status === "paused" ? (
            <Pressable
              onPress={() => onResume(item.id)}
              className="px-3 py-2 rounded-xl"
              style={{ backgroundColor: "#1b1b1b" }}
            >
              <Text className="text-white">Resume</Text>
            </Pressable>
          ) : null}

          {(["queued", "downloading", "paused"] as DownloadStatus[]).includes(status) ? (
            <Pressable
              onPress={() => onCancel(item.id)}
              className="px-3 py-2 rounded-xl"
              style={{ backgroundColor: "#1b1b1b" }}
            >
              <Text className="text-white">Cancel</Text>
            </Pressable>
          ) : null}

          {status === "completed" ? (
            <Pressable
              onPress={() => onOpen(item)}
              className="px-3 py-2 rounded-xl"
              style={{ backgroundColor: colors.brandYellow }}
            >
              <Text className="text-black font-semibold">Open</Text>
            </Pressable>
          ) : null}
        </View>

        {/* Error */}
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
        data={items}
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
