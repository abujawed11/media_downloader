// // app/(tabs)/downloads.tsx
// import ProgressBar from "@/src/components/ProgressBar";
// import { copyToDownloads } from "@/src/native/background/fileUtils";
// import { type Job } from "@/src/services/api/media";
// import type { JobStatus } from "@/src/store/useDownloads";
// import { useDownloads } from "@/src/store/useDownloads";
// import { colors } from "@/src/theme/colors";
// import * as FileSystem from "expo-file-system";
// import * as IntentLauncher from "expo-intent-launcher";
// import { useMemo } from "react";
// import { Alert, FlatList, Pressable, Text, View } from "react-native";

// const ACTIVE_STATUSES: ReadonlyArray<JobStatus> = ["queued", "downloading", "paused"];

// function fmtBytes(n?: number | null) {
//   if (!n || n <= 0) return "—";
//   const units = ["B", "KB", "MB", "GB", "TB"];
//   let u = 0,
//     v = n;
//   while (v >= 1024 && u < units.length - 1) {
//     v /= 1024;
//     u++;
//   }
//   return `${v.toFixed(u ? 1 : 0)} ${units[u]}`;
// }

// const mapJobStatusToStore = (s: Job["status"]) => {
//   switch (s) {
//     case "done":
//       return "completed";
//     case "error":
//       return "failed";
//     case "merging":
//       return "downloading";
//     default:
//       return s; // queued | downloading | paused | canceled
//   }
// };

// const statusColor: Record<import("@/src/store/useDownloads").JobStatus, string> = {
//   queued: "#8a8a8a",
//   downloading: colors.brandYellow,
//   paused: "#8888ff",
//   canceled: "#aaaaaa",
//   completed: "#2ecc71",
//   failed: "#ff5252",
// };

// export default function DownloadsScreen() {
//   const { jobs, pause, resume, cancel } = useDownloads();

//   const list = useMemo(() => Object.values(jobs), [jobs]);

//   async function onOpen(localUri?: string, mime?: string) {
//     if (!localUri) {
//       Alert.alert("Open", "File not available yet.");
//       return;
//     }
//     try {
//       // Convert file:// to content:// so Android can grant access
//       const fileUri = localUri.startsWith("file://") ? localUri : `file://${localUri}`;
//       const contentUri = await FileSystem.getContentUriAsync(fileUri);
//       await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
//         data: contentUri,
//         type: mime || "*/*",
//         flags: 1,
//       });
//     } catch (e) {
//       Alert.alert("Open", String(e));
//     }
//   }

//   const renderItem = ({ item }: { item: (typeof list)[number] }) => {
//     const pct = Math.max(0, Math.min(1, item.progress01 ?? 0));
//     const total = item.sizeBytes ?? null;
//     const title = item.title ?? "(untitled)";
//     const meta = [item.quality, item.ext?.toUpperCase?.()].filter(Boolean).join(" • ");
//     const status = item.status;

//     return (
//       <View
//         className="rounded-2xl p-3 mb-3"
//         style={{ backgroundColor: "#101010", borderWidth: 1, borderColor: "#1f1f1f" }}
//       >
//         {/* Header */}
//         <View className="flex-row justify-between items-center mb-2">
//           <Text className="text-white font-semibold flex-1 pr-2">{title}</Text>
//           <Text style={{ color: statusColor[status] }}>{status.toUpperCase()}</Text>
//         </View>

//         {/* Meta row */}
//         <Text className="text-gray-400 text-xs mb-2">
//           {meta ? `${meta} • ` : ""}
//           {total ? fmtBytes(total) : "size unknown"}
//         </Text>

//         {/* Progress */}
//         <ProgressBar progress={pct} />
//         <View className="flex-row justify-between mt-1">
//           <Text className="text-gray-400 text-xs">{Math.round(pct * 100)}%</Text>
//           <Text className="text-gray-400 text-xs">Background service active</Text>
//         </View>

//         {/* Controls */}
//         <View className="flex-row gap-2 mt-3">
//           {status === "downloading" ? (
//             <Pressable
//               onPress={() => pause?.(item.id)}
//               className="px-3 py-2 rounded-xl"
//               style={{ backgroundColor: "#1b1b1b" }}
//             >
//               <Text className="text-white">Pause</Text>
//             </Pressable>
//           ) : status === "paused" ? (
//             <Pressable
//               onPress={() => resume?.(item.id)}
//               className="px-3 py-2 rounded-xl"
//               style={{ backgroundColor: "#1b1b1b" }}
//             >
//               <Text className="text-white">Resume</Text>
//             </Pressable>
//           ) : null}

//           {ACTIVE_STATUSES.includes(status) ? (
//             <Pressable
//               onPress={() => cancel?.(item.id)}
//               className="px-3 py-2 rounded-xl"
//               style={{ backgroundColor: "#1b1b1b" }}
//             >
//               <Text className="text-white">Cancel</Text>
//             </Pressable>
//           ) : null}

//           {status === "completed" ? (
//             <View className="flex-row gap-2">
//               <Pressable
//                 // onPress={() => onOpen(item.localUri, item.mime)}
//                 onPress={() => onOpen(item.localUri ?? undefined, item.mime ?? undefined)}
//                 className="px-3 py-2 rounded-xl"
//                 style={{ backgroundColor: colors.brandYellow }}
//               >
//                 <Text className="text-black font-semibold">Open</Text>
//               </Pressable>

//               <Pressable
//                 onPress={async () => {
//                   try {
//                     if (!item.localUri) throw new Error("No local file");
//                     const uri = await copyToDownloads(
//                       item.localUri,
//                       item.fileName || "download.mp4",
//                       item.mime ?? undefined
//                     );
//                     Alert.alert("Saved", `Copied to: ${uri}`);
//                   } catch (e: any) {
//                     Alert.alert("Save failed", String(e));
//                   }
//                 }}
//                 className="px-3 py-2 rounded-xl"
//                 style={{ backgroundColor: "#1b1b1b" }}
//               >
//                 <Text className="text-white">Save</Text>
//               </Pressable>
//             </View>
//           ) : null}
//         </View>

//         {status === "failed" && item.error ? (
//           <Text className="text-red-400 text-xs mt-2">{String(item.error)}</Text>
//         ) : null}
//       </View>
//     );
//   };

//   return (
//     <View className="flex-1 bg-black px-4 pt-14">
//       <Text className="text-white text-lg font-semibold mb-3">Downloads</Text>
//       <FlatList
//         data={list}
//         renderItem={renderItem}
//         keyExtractor={(it) => it.id}
//         ListEmptyComponent={
//           <Text className="text-gray-500 mt-10 self-center">No downloads yet.</Text>
//         }
//         contentContainerStyle={{ paddingBottom: 40 }}
//       />
//     </View>
//   );
// }



// app/(tabs)/downloads.tsx
import ProgressBar from "@/src/components/ProgressBar";
import { ensureJobsBusStarted } from "@/src/services/realtime/jobsBus";
import { useDownloads } from "@/src/store/useDownloads";
import { listJobs, getJob, downloadJobFile } from "@/src/services/api/media";
import { useJobProgress } from "@/src/features/downloader/hooks/useJobProgress";
import { API_URL } from "@/src/config/env";
import * as FileSystem from "expo-file-system";
import * as IntentLauncher from "expo-intent-launcher";
import * as MediaLibrary from "expo-media-library";
import { useMemo, useEffect, useState } from "react";
import { Alert, FlatList, Pressable, Text, View } from "react-native";

const ACTIVE_STATUSES: ReadonlyArray<import("@/src/store/useDownloads").JobStatus> = ["queued", "downloading", "paused"];

// Map server job status to store status
function mapServerStatusToStore(serverStatus: string): import("@/src/store/useDownloads").JobStatus {
  switch (serverStatus) {
    case "done": return "completed";
    case "error": return "failed";
    case "merging": return "downloading";
    case "canceled": return "canceled";
    default: return serverStatus as import("@/src/store/useDownloads").JobStatus;
  }
}

function fmtBytes(n?: number | null) {
  if (!n || n <= 0) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let v = n, u = 0;
  while (v >= 1024 && u < units.length - 1) { v /= 1024; u++; }
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
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function DownloadsScreen() {
  ensureJobsBusStarted(); // one-time singleton start (safe to call on each render)
  const { jobs, pause, resume, cancel, updateJobFromServer } = useDownloads();
  const list = useMemo(() => Object.values(jobs), [jobs]);
  
  // Track downloading jobs to prevent multiple simultaneous downloads
  const [downloadingJobs, setDownloadingJobs] = useState<Set<string>>(new Set());

  // Load existing jobs from server on mount (like web app)
  useEffect(() => {
    (async () => {
      try {
        const serverJobs = await listJobs();
        serverJobs.forEach(job => {
          updateJobFromServer({
            id: job.id,
            title: job.title || undefined,
            fileName: job.filename || `${job.title || 'download'}.${job.ext || 'mp4'}`,
            quality: job.format_string,
            ext: job.ext || 'mp4',
            progress01: job.progress,
            status: mapServerStatusToStore(job.status),
            totalBytes: job.total_bytes,
            downloadedBytes: job.downloaded_bytes,
            speedBps: job.speed_bps,
            etaSeconds: job.eta_seconds,
            error: job.error || undefined,
            _lastPolled: Date.now(),
          });
        });
      } catch (e) {
        console.error('Failed to load jobs:', e);
      }
    })();
  }, [updateJobFromServer]);

  // Poll active jobs and recently completed ones (like web app)
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const now = Date.now();
        const jobsToUpdate = list.filter(j => {
          if (!['completed', 'failed', 'canceled'].includes(j.status)) return true;
          // For completed jobs, poll for first 5 seconds after completion
          if (j.status === 'completed') {
            const updatedRecently = !j._lastPolled || (now - j._lastPolled) < 5000;
            return updatedRecently;
          }
          return false;
        });

        if (jobsToUpdate.length === 0) return;

        await Promise.all(jobsToUpdate.map(async j => {
          try {
            const fresh = await getJob(j.id);
            updateJobFromServer({
              id: fresh.id,
              title: fresh.title || j.title,
              fileName: j.fileName,
              quality: j.quality,
              ext: j.ext,
              progress01: fresh.progress,
              status: mapServerStatusToStore(fresh.status),
              totalBytes: fresh.total_bytes,
              downloadedBytes: fresh.downloaded_bytes,
              speedBps: fresh.speed_bps,
              etaSeconds: fresh.eta_seconds,
              error: fresh.error || undefined,
              _lastPolled: now,
            });
          } catch (e) {
            // Ignore individual job failures
          }
        }));
      } catch (e) {
        // Ignore transient errors
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [list, updateJobFromServer]);

  async function onOpen(localUri?: string | null, mime?: string) {
    console.log(`[DEBUG] onOpen called with localUri: ${localUri}, mime: ${mime}`);
    
    if (!localUri) {
      Alert.alert("Open", "File not available yet.");
      return;
    }
    
    try {
      const fileUri = localUri.startsWith("file://") ? localUri : `file://${localUri}`;
      console.log(`[DEBUG] File URI: ${fileUri}`);
      
      const contentUri = await FileSystem.getContentUriAsync(fileUri);
      console.log(`[DEBUG] Content URI: ${contentUri}`);
      
      await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
        data: contentUri,
        type: mime || "*/*",
        flags: 1,
      });
      
      console.log(`[DEBUG] File opened successfully`);
    } catch (e) {
      console.log(`[DEBUG] Open failed: ${e}`);
      Alert.alert("Open failed", String(e));
    }
  }

  async function onDownloadAndOpen(jobId: string, title?: string, ext?: string) {
    console.log(`[DEBUG] onDownloadAndOpen called with jobId: ${jobId}, title: ${title}, ext: ${ext}`);
    
    // Prevent multiple simultaneous downloads
    if (downloadingJobs.has(jobId)) {
      console.log(`[DEBUG] Download already in progress for job ${jobId}, skipping`);
      return;
    }
    
    // Add to downloading set
    setDownloadingJobs(prev => new Set(prev).add(jobId));
    
    try {
      // Check permissions first
      console.log(`[DEBUG] Requesting MediaLibrary permissions...`);
      const { status } = await MediaLibrary.requestPermissionsAsync();
      console.log(`[DEBUG] MediaLibrary permission status: ${status}`);
      
      if (status !== 'granted') {
        Alert.alert("Permission needed", "Storage permission is required to download files.");
        setDownloadingJobs(prev => {
          const newSet = new Set(prev);
          newSet.delete(jobId);
          return newSet;
        });
        return;
      }

      // Show loading alert
      Alert.alert("Downloading...", "Saving file to your gallery...", [
        { text: "Cancel", style: "cancel" }
      ]);

      // Create filename
      const fileName = `${(title || 'download').replace(/[^\w\s.-]/g, '_')}.${ext || 'mp4'}`;
      console.log(`[DEBUG] Generated filename: ${fileName}`);
      
      // Step 1: Download to temporary location first
      const tempFileUri = `${FileSystem.cacheDirectory}${fileName}`;
      console.log(`[DEBUG] Temp file URI: ${tempFileUri}`);
      
      const downloadUrl = `${API_URL}/jobs/${jobId}/file`;
      console.log(`[DEBUG] Downloading from: ${downloadUrl}`);
      
      const downloadResult = await FileSystem.downloadAsync(downloadUrl, tempFileUri);
      console.log(`[DEBUG] Download result:`, downloadResult);
      
      if (downloadResult.status !== 200) {
        throw new Error(`Download failed with status: ${downloadResult.status}`);
      }

      console.log(`[DEBUG] File downloaded successfully to temp: ${tempFileUri}`);

      // Step 2: Save to MediaLibrary (Gallery) immediately
      try {
        console.log(`[DEBUG] Creating asset from temp file...`);
        console.log(`[DEBUG] File exists check:`, await FileSystem.getInfoAsync(tempFileUri));
        
        // Try creating asset with explicit mediaType
        const asset = await MediaLibrary.createAssetAsync(tempFileUri, {
          mediaType: MediaLibrary.MediaType.video,
        });
        console.log(`[DEBUG] Asset created successfully:`, asset);
        console.log(`[DEBUG] Asset URI: ${asset.uri}`);
        
        // Step 3: Create/Add to Downloads album
        console.log(`[DEBUG] Looking for Downloads album...`);
        let album = await MediaLibrary.getAlbumAsync("Downloads");
        console.log(`[DEBUG] Downloads album found:`, album);
        
        if (!album) {
          console.log(`[DEBUG] Creating Downloads album...`);
          album = await MediaLibrary.createAlbumAsync("Downloads", asset, false);
          console.log(`[DEBUG] Downloads album created:`, album);
        } else {
          console.log(`[DEBUG] Adding asset to Downloads album...`);
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
          console.log(`[DEBUG] Asset added to Downloads album successfully`);
        }

        // Update the job with gallery file info
        updateJobFromServer({
          id: jobId,
          localUri: asset.uri, // This is the gallery URI
          fileName: fileName,
        });

        // Step 4: Try to open the file
        try {
          await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
            data: asset.uri,
            type: ext === 'mp3' || ext === 'm4a' ? `audio/${ext}` : `video/${ext || 'mp4'}`,
            flags: 1,
          });
          
          Alert.alert("Success!", "File saved to gallery and opened successfully!");
          
        } catch (openError) {
          console.error('Error opening file:', openError);
          Alert.alert(
            "File Saved!", 
            "File has been saved to your device gallery in the 'Downloads' album. You can open it from your gallery app.",
            [{ text: "OK" }]
          );
        }

        // Clean up temp file
        try {
          await FileSystem.deleteAsync(tempFileUri);
        } catch (cleanupError) {
          console.log('Could not clean up temp file:', cleanupError);
        }

      } catch (galleryError) {
        console.error('Error saving to gallery:', galleryError);
        
        // Fallback: Try copying to a different location and save to gallery
        try {
          console.log(`[DEBUG] Trying alternative approach - copying to Documents first`);
          const altFileName = `MediaDownload_${Date.now()}.${ext || 'mp4'}`;
          const altFileUri = `${FileSystem.documentDirectory}${altFileName}`;
          
          await FileSystem.copyAsync({
            from: tempFileUri,
            to: altFileUri
          });
          
          console.log(`[DEBUG] File copied to: ${altFileUri}`);
          
          // Try creating asset from new location
          const asset = await MediaLibrary.createAssetAsync(altFileUri, {
            mediaType: MediaLibrary.MediaType.video,
          });
          
          console.log(`[DEBUG] Asset created from alternative location:`, asset);
          
          updateJobFromServer({
            id: jobId,
            localUri: asset.uri,
            fileName: fileName,
          });
          
          Alert.alert("Success!", "File saved to gallery successfully!");
          
          // Clean up temp files
          try {
            await FileSystem.deleteAsync(tempFileUri);
            await FileSystem.deleteAsync(altFileUri);
          } catch {}
          
        } catch (altError) {
          console.error('Alternative method also failed:', altError);
          
          // Final fallback: keep in app storage
          updateJobFromServer({
            id: jobId,
            localUri: tempFileUri,
            fileName: fileName,
          });
          
          Alert.alert(
            "Partially Complete",
            "File downloaded but couldn't save to gallery. You can still open it from this app.",
            [
              {
                text: "Try Open",
                onPress: () => onOpen(tempFileUri, `video/${ext || 'mp4'}`)
              },
              { text: "OK", style: "cancel" }
            ]
          );
        }
      }

    } catch (e) {
      console.error('Download error:', e);
      Alert.alert("Download failed", `Error: ${String(e)}\n\nPlease try again.`);
    } finally {
      // Always remove from downloading set
      setDownloadingJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
    }
  }

  const Row = ({ item }: { item: (typeof list)[number] }) => {
    // Subscribe to progress polling for this job
    useJobProgress(item.id);

    const pct = Math.max(0, Math.min(1, item.progress01 ?? 0));
    // const total = item.totalBytes ?? item.sizeBytes ?? null;
    // const downloaded = item.downloadedBytes ?? (total ? Math.round(total * pct) : null);
    const total = item.totalBytes ?? item.sizeBytes ?? null;
    const downloaded = typeof item.downloadedBytes === "number"
      ? item.downloadedBytes
      : (total ? Math.round(total * (item.progress01 ?? 0)) : null);
    const title = item.title ?? "(untitled)";
    const meta = [item.quality, item.ext?.toUpperCase?.()].filter(Boolean).join(" • ");
    const status = item.status;

    return (
      <View className="bg-neutral-900 rounded-2xl p-3 mb-3">
        {/* Title & meta */}
        <Text className="text-white font-medium" numberOfLines={2}>{title}</Text>
        {!!meta && <Text className="text-gray-400 text-xs mt-0.5">{meta}</Text>}

        {/* Progress */}
        <View className="mt-3">
          <ProgressBar progress={pct} />
          <View className="flex-row justify-between mt-2">
            <Text className="text-gray-400 text-xs">
              {fmtBytes(downloaded)} / {fmtBytes(total)}
            </Text>
            <Text className="text-gray-400 text-xs">
              {item.part === "merging" ? "Merging…" : fmtSpeed(item.speedBps)} • ETA {fmtEta(item.etaSeconds)}
            </Text>
          </View>
        </View>

        {/* Controls */}
        <View className="flex-row gap-2 mt-3">
          {status === "downloading" ? (
            <Pressable onPress={() => pause?.(item.id)} className="px-3 py-2 rounded-xl" style={{ backgroundColor: "#1b1b1b" }}>
              <Text className="text-white">Pause</Text>
            </Pressable>
          ) : status === "paused" ? (
            <Pressable onPress={() => resume?.(item.id)} className="px-3 py-2 rounded-xl" style={{ backgroundColor: "#1b1b1b" }}>
              <Text className="text-white">Resume</Text>
            </Pressable>
          ) : null}

          {ACTIVE_STATUSES.includes(status) ? (
            <Pressable onPress={() => cancel?.(item.id)} className="px-3 py-2 rounded-xl" style={{ backgroundColor: "#1b1b1b" }}>
              <Text className="text-white">Cancel</Text>
            </Pressable>
          ) : null}

          {/* Open button for completed jobs */}
          {status === "completed" ? (
            <Pressable 
              onPress={() => {
                if (downloadingJobs.has(item.id)) return; // Prevent double-tap
                
                console.log(`[DEBUG] Button pressed for job ${item.id}`);
                console.log(`[DEBUG] item.localUri: ${item.localUri}`);
                console.log(`[DEBUG] Will call: ${item.localUri ? 'onOpen' : 'onDownloadAndOpen'}`);
                
                if (item.localUri && item.localUri.includes('content://')) {
                  // File is in gallery, open directly
                  console.log(`[DEBUG] Opening gallery file: ${item.localUri}`);
                  onOpen(item.localUri, item.mime || undefined);
                } else {
                  // File not in gallery yet, download and save to gallery
                  console.log(`[DEBUG] File needs to be saved to gallery`);
                  onDownloadAndOpen(item.id, item.title || undefined, item.ext || undefined);
                }
              }}
              disabled={downloadingJobs.has(item.id)}
              className="px-3 py-2 rounded-xl" 
              style={{ 
                backgroundColor: downloadingJobs.has(item.id) ? "#333" : "#1b1b1b",
                opacity: downloadingJobs.has(item.id) ? 0.6 : 1,
              }}
            >
              <Text className="text-white">
                {downloadingJobs.has(item.id) 
                  ? "Saving..." 
                  : (item.localUri && item.localUri.includes('content://')) 
                    ? "Open" 
                    : "Save to Gallery"
                }
              </Text>
            </Pressable>
          ) : null}
        </View>

        {!!item.error && <Text className="text-red-400 text-xs mt-2">{item.error}</Text>}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-black px-4 pt-14">
      <Text className="text-white text-lg font-semibold mb-3">Downloads</Text>
      <FlatList
        data={list}
        renderItem={({ item }) => <Row item={item} />}
        keyExtractor={(it) => it.id}
        ListEmptyComponent={<Text className="text-gray-500 mt-10 self-center">No downloads yet.</Text>}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
  );
}
