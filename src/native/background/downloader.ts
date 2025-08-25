// // src/native/background/downloader.ts
// import RNBackgroundDownloader from "react-native-background-downloader";

// export type StartBgArgs = {
//   id: string;                       // stable ID you also store in your Zustand job
//   url: string;                      // direct link from your backend
//   fileName: string;                 // e.g., "video-360p.mp4"
//   headers?: Record<string, string>; // cookies, Authorization, UA, etc (from backend)
// };

// export function appFilePath(fileName: string) {
//   // App-private directory (fast & reliable)
//   return `${RNBackgroundDownloader.directories.documents}/${fileName}`;
// }

// export function startBackgroundDownload(
//   { id, url, fileName, headers = {} }: StartBgArgs,
//   {
//     onBegin,
//     onProgress,
//     onDone,
//     onError,
//   }: {
//     onBegin?: (expectedBytes?: number) => void;
//     onProgress?: (p01: number) => void;
//     onDone?: (localPath: string) => void;
//     onError?: (err: any) => void;
//   } = {}
// ) {
//   const destination = appFilePath(fileName);

//   const task = RNBackgroundDownloader.download({
//     id,
//     url,
//     destination,
//     headers,
//     // Foreground service notification (Android)
//     notificationTitle: "Downloading…",
//     notificationDescription: fileName,
//   });

//   task.begin((expectedBytes: number) => onBegin?.(expectedBytes));
//   task.progress((p: number) => onProgress?.(p));
//   task.done(() => onDone?.(destination));
//   task.error((err: any) => onError?.(err));

//   return task; // keep in store to pause/resume/stop
// }


// src/native/background/downloader.ts
// import * as FileSystem from "expo-file-system";

// // Lazy-require the native module so web / Expo Go / early init won't crash.
// function getRNBD(): any | null {
//   try {
//     // Some builds export default, others export the object itself.
//     const mod = require("react-native-background-downloader");
//     return mod?.default ?? mod ?? null;
//   } catch {
//     return null;
//   }
// }

// function getDocsDir(): string {
//   const RNBD = getRNBD();
//   const docs =
//     RNBD?.directories?.documents ||
//     RNBD?.directories?.documentsDirectory ||
//     null;

//   // Fallback to Expo FS app directory if native module isn't ready
//   // (This still downloads to app-private storage; background service requires a dev build)
//   const fsDoc = FileSystem.documentDirectory?.replace(/\/$/, "");
//   return (docs as string) || (fsDoc as string) || "";
// }

// export type StartBgArgs = {
//   id: string;
//   url: string;
//   fileName: string;
//   headers?: Record<string, string>;
// };

// export function appFilePath(fileName: string) {
//   const base = getDocsDir();
//   if (!base) {
//     // Strong signal: not running in a dev build with RNBD installed
//     throw new Error(
//       "Background downloader not available. Install/run your Expo Development Build (not Expo Go), then try again."
//     );
//   }
//   return `${base}/${fileName}`;
// }

// export function startBackgroundDownload(
//   { id, url, fileName, headers = {} }: StartBgArgs,
//   {
//     onBegin,
//     onProgress,
//     onDone,
//     onError,
//   }: {
//     onBegin?: (expectedBytes?: number) => void;
//     onProgress?: (p01: number) => void;
//     onDone?: (localPath: string) => void;
//     onError?: (err: any) => void;
//   } = {}
// ) {
//   const RNBD = getRNBD();
//   if (!RNBD?.download) {
//     // Clear guidance if the user accidentally launched in Expo Go
//     throw new Error(
//       "react-native-background-downloader is not linked. Use your Expo Development Build (eas build --profile development) and run that APK."
//     );
//   }

//   const destination = appFilePath(fileName);

//   // Accept notification props even if types don’t declare them.
//   const task: any = RNBD.download({
//     id,
//     url,
//     destination,
//     headers,
//     notificationTitle: "Downloading…",
//     notificationDescription: fileName,
//   } as any);

//   // Handle both handler shapes: number OR object
//   task.begin((arg: any) => {
//     const expected =
//       typeof arg === "number" ? arg : arg?.expectedBytes ?? arg?.totalBytes;
//     onBegin?.(expected);
//   });

//   task.progress((p: any) => {
//     const v = typeof p === "number" ? p : p?.progress ?? 0;
//     onProgress?.(v > 1 ? v / 100 : v);
//   });

//   task.done(() => onDone?.(destination));
//   task.error((err: any) => onError?.(err));

//   return task;
// }



// src/native/background/downloader.ts
import * as FileSystem from "expo-file-system";

function getRNBD(): any | null {
  try {
    // Try the maintained fork first
    const mod = require("@kesha-antonov/react-native-background-downloader");
    return mod?.default ?? mod ?? null;
  } catch {
    try {
      // Fallback: old package (if it’s still installed)
      const old = require("react-native-background-downloader");
      return old?.default ?? old ?? null;
    } catch {
      return null;
    }
  }
}

function getDocsDir(): string {
  const RNBD = getRNBD();
  const docs = RNBD?.directories?.documents ?? RNBD?.directories?.documentsDirectory ?? null;
  const fsDoc = FileSystem.documentDirectory?.replace(/\/$/, "");
  return (docs as string) || (fsDoc as string) || "";
}

export type StartBgArgs = {
  id: string;
  url: string;
  fileName: string;
  headers?: Record<string, string>;
};

export function appFilePath(fileName: string) {
  const base = getDocsDir();
  if (!base) {
    throw new Error("Background downloader not available. Install/run your Expo Dev Build (not Expo Go).");
  }
  return `${base}/${fileName}`;
}

export function startBackgroundDownload(
  { id, url, fileName, headers = {} }: StartBgArgs,
  {
    onBegin,
    onProgress,
    onDone,
    onError,
  }: {
    onBegin?: (expectedBytes?: number) => void;
    onProgress?: (p01: number) => void;
    onDone?: (localPath: string) => void;
    onError?: (err: any) => void;
  } = {}
) {
  const RNBD = getRNBD();
  if (!RNBD?.download) {
    throw new Error("RNBackgroundDownloader is not linked. Use your Expo Development Build APK.");
  }

  const destination = appFilePath(fileName);

  const task: any = RNBD.download({
    id,
    url,
    destination,
    headers,
    // Supported in the fork:
    notificationTitle: "Downloading…",
    notificationDescription: fileName,
  } as any);

  // New fork: begin({ expectedBytes, headers }) ; old: begin(number or object)
  task.begin((arg: any) => {
    const expected =
      typeof arg === "number" ? arg : arg?.expectedBytes ?? arg?.totalBytes;
    onBegin?.(expected);
  });

  // Fork: progress({ bytesDownloaded, bytesTotal })
  // Old: progress(number 0..1 or 0..100) or progress({ progress })
  task.progress((arg: any) => {
    let p01 = 0;
    if (typeof arg === "number") p01 = arg > 1 ? arg / 100 : arg;
    else if (typeof arg === "object") {
      if (typeof arg.bytesDownloaded === "number" && typeof arg.bytesTotal === "number" && arg.bytesTotal > 0) {
        p01 = arg.bytesDownloaded / arg.bytesTotal;
      } else if (typeof arg.progress === "number") {
        p01 = arg.progress > 1 ? arg.progress / 100 : arg.progress;
      }
    }
    onProgress?.(Math.max(0, Math.min(1, p01)));
  });

  task.done(() => onDone?.(destination));
  task.error((err: any) => onError?.(err));

  return task;
}
