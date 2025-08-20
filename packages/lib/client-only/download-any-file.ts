import type { DocumentData } from '@prisma/client';

import { getFile } from '../universal/upload/get-file';
import { downloadFile } from './download-file';

type DownloadAnyFileProps = {
  documentData: DocumentData;
  fileName?: string;

  mimeType?: string;
};

export const downloadAnyFile = async ({
  documentData,
  fileName,
  mimeType,
}: DownloadAnyFileProps) => {
  const bytes = await getFile({
    type: documentData.type,
    data: documentData.initialData,
  });

  // Determine MIME type
  let contentType = mimeType;

  if (!contentType && fileName) {
    const extension = fileName.split('.').pop()?.toLowerCase();
    contentType = getMimeTypeFromExtension(extension);
  }

  if (!contentType) {
    contentType = 'application/octet-stream';
  }

  const blob = new Blob([bytes], {
    type: contentType,
  });

  const baseFileName = fileName ?? 'document';

  downloadFile({
    filename: baseFileName,
    data: blob,
  });
};

/**
 * Helper function to get MIME type from file extension
 */
const getMimeTypeFromExtension = (extension?: string): string => {
  if (!extension) return 'application/octet-stream';

  const mimeTypes: Record<string, string> = {
    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain',
    rtf: 'application/rtf',

    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    bmp: 'image/bmp',
    webp: 'image/webp',

    // Audio
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    flac: 'audio/flac',

    // Video
    mp4: 'video/mp4',
    avi: 'video/x-msvideo',
    mov: 'video/quicktime',
    wmv: 'video/x-ms-wmv',

    // Archives
    zip: 'application/zip',
    rar: 'application/vnd.rar',
    '7z': 'application/x-7z-compressed',
    tar: 'application/x-tar',
    gz: 'application/gzip',

    // Code files
    html: 'text/html',
    css: 'text/css',
    js: 'text/javascript',
    json: 'application/json',
    xml: 'application/xml',
    csv: 'text/csv',
  };

  return mimeTypes[extension] || 'application/octet-stream';
};
