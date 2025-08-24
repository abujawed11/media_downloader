export const isValidUrl = (u: string) => {
  try { new URL(u); return true; } catch { return false; }
};
