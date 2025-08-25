// src/native/background/fileUtils.ts
import * as FileSystem from "expo-file-system";

/**
 * Copy a file from app-private storage to the user-selected public folder
 * (e.g. Downloads) using the Android Storage Access Framework.
 */
export async function copyToDownloads(
  localPath: string,
  targetFileName: string,
  mime = "video/mp4"
) {
  const perm = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
  if (!perm.granted) throw new Error("User cancelled directory picker");

  // Read downloaded file as base64
  const base64 = await FileSystem.readAsStringAsync(localPath, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Create new file in picked directory
  const uri = await FileSystem.StorageAccessFramework.createFileAsync(
    perm.directoryUri,
    targetFileName,
    mime
  );

  // Write into it
  await FileSystem.writeAsStringAsync(uri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return uri; // content:// URI in public storage
}
