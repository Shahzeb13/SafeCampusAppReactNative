/**
 * Formats a number of bytes into a human-readable string (e.g., "1.5 MB").
 */
export const formatBytes = (bytes?: number) => {
  if (bytes === undefined || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Formats milliseconds into a human-readable duration string (e.g., "1:30").
 */
export const formatDurationMs = (ms?: number) => {
  if (ms === undefined) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};
