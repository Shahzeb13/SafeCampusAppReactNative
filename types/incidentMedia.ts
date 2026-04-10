export type IncidentMedia = {
  uri: string;
  type: 'image' | 'video';
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  duration?: number;
};