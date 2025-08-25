// app/(tabs)/index.tsx
import FloatingInput from "@/src/components/FloatingInput";
import { useInfo } from "@/src/features/downloader/hooks/useInfo";
import type { FormatOption } from "@/src/features/downloader/types";
import { isValidUrl } from "@/src/features/downloader/utils";
import { getDirectUrl } from "@/src/services/api/media"; // <-- implement as shown
import { useDownloads } from "@/src/store/useDownloads";
import { colors } from "@/src/theme/colors";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { v4 as uuidv4 } from "uuid";

// --- UI helpers ---
function PillButton({
  title,
  onPress,
  disabled,
}: {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="rounded-2xl px-4 py-3 items-center"
      style={{
        backgroundColor: colors.brandYellow,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <Text className="text-black font-semibold">{title}</Text>
    </Pressable>
  );
}

const COMMON_FORMATS = ["360p", "720p", "1080p", "mp3"] as const;
type CommonFormat = (typeof COMMON_FORMATS)[number];

export default function HomeScreen() {
  const [url, setUrl] = useState("");
  const [formatModalOpen, setFormatModalOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);

  const { loading, data, error, fetchInfo } = useInfo();
  const downloads = useDownloads();

  async function handlePaste() {
    const clip = await Clipboard.getStringAsync();
    if (clip && isValidUrl(clip)) setUrl(clip);
    else Alert.alert("Clipboard", "No valid URL found in clipboard.");
  }

  const platform = useMemo(() => {
    const u = (url || "").toLowerCase();
    if (u.includes("youtu")) return "YouTube";
    if (u.includes("instagram")) return "Instagram";
    if (u.includes("facebook") || u.includes("fb.watch")) return "Facebook";
    if (u.includes("twitter") || u.includes("x.com")) return "Twitter / X";
    return null;
  }, [url]);

  async function onGetInfo() {
    if (!isValidUrl(url)) {
      Alert.alert("Invalid URL", "Please enter a valid media URL.");
      return;
    }
    await fetchInfo(url);
    setSelectedFormat(null);
  }

  function fmtDisplay(f: FormatOption) {
    const size =
      typeof f.sizeBytes === "number" ? ` ~${(f.sizeBytes / 1e6).toFixed(1)}MB` : "";
    const note = f.note ? ` • ${f.note}` : "";
    return `${f.label} • ${f.ext?.toUpperCase?.() ?? ""}${note}${size}`;
  }

  function openFormatPicker(preset?: CommonFormat) {
    if (preset && data?.formats?.length) {
      const target =
        preset === "mp3"
          ? data.formats.find(
              (f) =>
                f.label?.toLowerCase().includes("audio") ||
                f.ext === "mp3" ||
                f.ext === "m4a"
            )
          : data.formats.find((f) => f.label?.toLowerCase().includes(preset));
      setSelectedFormat(target?.format_string ?? null);
    }
    setFormatModalOpen(true);
  }

  async function onStartDownload() {
    try {
      if (!data || !selectedFormat) {
        Alert.alert("Pick a format", "Please select a format to download.");
        return;
      }

      // Find chosen format for meta
      const chosen = data.formats.find((f) => f.format_string === selectedFormat);
      const title = data.title || "Untitled";
      const fileSafeTitle = title.replace(/[\\/:*?"<>|]/g, "_");
      const ext = chosen?.ext || "mp4";
      const fileName = `${fileSafeTitle}.${ext}`;

      // 1) Ask backend for a direct URL + headers
      const direct = await getDirectUrl({ url, format_id: selectedFormat });
      // direct: { url, fileName?, mime?, headers? }
      const finalFileName = direct.fileName || fileName;

      // 2) Generate a stable ID for RNBD (and store)
      const jobId = uuidv4();

      // 3) Start background download (store handles progress/done/error)
      await downloads.start({
        id: jobId,
        title,
        url: direct.url,
        fileName: finalFileName,
        headers: direct.headers,
        mime: direct.mime,
        sizeBytes: chosen?.sizeBytes ?? null,
        quality: chosen?.label ?? null,
        ext: chosen?.ext ?? null,
      });

      // 4) Go to Downloads tab
      setFormatModalOpen(false);
      router.push("/(tabs)/downloads");
    } catch (e: any) {
      Alert.alert("Download failed", e?.message ?? "Unknown error");
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1"
    >
      <ScrollView
        className="flex-1 bg-black px-4 pt-14"
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Title + platform badge */}
        <View className="mb-4">
          <Text
            className="text-[24px] font-bold"
            style={{ color: colors.brandYellow }}
          >
            Media Downloader
          </Text>
          {platform ? (
            <View
              className="self-start mt-2 rounded-full px-3 py-1"
              style={{ backgroundColor: "#111" }}
            >
              <Text className="text-gray-300 text-xs">Detected: {platform}</Text>
            </View>
          ) : null}
        </View>

        {/* URL input + actions */}
        <FloatingInput
          label="Paste a URL"
          value={url}
          onChangeText={setUrl}
          placeholder="https://youtube.com/..."
          autoCapitalize="none"
          autoCorrect={false}
        />

        <View className="flex-row gap-3 mt-1">
          <PillButton title="Paste" onPress={handlePaste} />
          <PillButton
            title={loading ? "Fetching..." : "Get Info"}
            onPress={onGetInfo}
            disabled={!url || loading}
          />
        </View>

        {/* Error */}
        {error ? <Text className="text-red-400 mt-3">{String(error)}</Text> : null}

        {/* Metadata card */}
        {data ? (
          <View
            className="mt-6 rounded-2xl p-3"
            style={{ backgroundColor: "#0f0f0f" }}
          >
            {!!data.thumbnail && (
              <Image
                source={{ uri: data.thumbnail }}
                className="w-full h-44 rounded-xl"
                resizeMode="cover"
              />
            )}
            <Text className="text-white mt-3 font-semibold">{data.title}</Text>
            <Text className="text-gray-400 mt-1">
              Duration: {data.duration ? `${data.duration}s` : "—"}
            </Text>

            {/* Quick picks */}
            <Text className="text-gray-300 mt-4 mb-2">Quick pick</Text>
            <View className="flex-row flex-wrap gap-2">
              {COMMON_FORMATS.map((f) => (
                <Pressable
                  key={f}
                  onPress={() => openFormatPicker(f)}
                  className="px-3 py-2 rounded-full"
                  style={{
                    backgroundColor: "#1a1a1a",
                    borderWidth: 1,
                    borderColor: "#333",
                  }}
                >
                  <Text className="text-white text-xs uppercase">{f}</Text>
                </Pressable>
              ))}
              <Pressable
                onPress={() => openFormatPicker()}
                className="px-3 py-2 rounded-full"
                style={{ backgroundColor: colors.brandYellow }}
              >
                <Text className="text-black text-xs font-semibold">All formats…</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Format Picker Modal */}
      <Modal
        visible={formatModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setFormatModalOpen(false)}
      >
        <View
          className="flex-1 justify-end"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
        >
          <View className="rounded-t-3xl p-4" style={{ backgroundColor: "#0b0b0b" }}>
            <View
              className="h-1 w-14 self-center rounded-full mb-3"
              style={{ backgroundColor: "#333" }}
            />
            <Text className="text-white text-lg font-semibold">Choose a format</Text>

            {data ? (
              <Text className="text-gray-400 mt-1">
                Available: {data.formats.length}
              </Text>
            ) : null}

            {/* ALL formats */}
            {data?.formats?.length ? (
              <>
                <Text className="text-gray-300 mt-4 mb-2">All formats</Text>
                <View className="flex-row flex-wrap gap-2">
                  {data.formats.map((f, idx) => {
                    const isActive = selectedFormat === f.format_string;
                    return (
                      <Pressable
                        key={`${f.format_string}-${idx}`}
                        onPress={() => setSelectedFormat(f.format_string)}
                        className="px-3 py-2 rounded-full"
                        style={{
                          backgroundColor: isActive ? colors.brandYellow : "#151515",
                        }}
                      >
                        <Text style={{ color: isActive ? "black" : "white" }}>
                          {fmtDisplay(f)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : null}

            {/* Actions */}
            <View className="flex-row justify-between mt-6">
              <Pressable
                onPress={() => setFormatModalOpen(false)}
                className="px-4 py-3 rounded-2xl"
                style={{ backgroundColor: "#1b1b1b" }}
              >
                <Text className="text-white">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={onStartDownload}
                disabled={!selectedFormat}
                className="px-4 py-3 rounded-2xl"
                style={{
                  backgroundColor: colors.brandYellow,
                  opacity: selectedFormat ? 1 : 0.6,
                }}
              >
                <Text className="text-black font-semibold">Download</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
