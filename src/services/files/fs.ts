// src/services/files/fs.ts
import * as MediaLibrary from "expo-media-library";

/** Save a file at a temp path into the Android "Download" album and return the asset URI. */
export async function saveToDownloads(tempPath: string): Promise<string> {
  const perm = await MediaLibrary.requestPermissionsAsync();
  if (!perm.granted) throw new Error("Storage permission not granted");
  const asset = await MediaLibrary.createAssetAsync(tempPath);
  let album = await MediaLibrary.getAlbumAsync("Download");
  if (!album) {
    album = await MediaLibrary.createAlbumAsync("Download", asset, false);
  } else {
    await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
  }
  return asset.uri;
}
