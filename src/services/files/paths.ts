// src/services/files/paths.ts
import * as FileSystem from "expo-file-system";

export const CACHE_DIR = FileSystem.cacheDirectory || FileSystem.documentDirectory!;
export function cachePath(name: string) {
  return `${CACHE_DIR}${name}`;
}
