import type { DocumentDataType } from '@prisma/client';
import JSZip from 'jszip';

import { getMultipleFiles } from '../universal/upload/get-multiple-files';

type FileData = {
  multipleFiles: {
    title: string;
    documentData: {
      initialData: string;
      type: DocumentDataType;
    };
  }[];
};

type letFiles = {
  title: string;
  data: Blob;
};

export const downloadAnyFileMultiple = async ({ multipleFiles }: FileData) => {
  const files: letFiles[] = [];
  try {
    for (const fileData of multipleFiles) {
      const { documentData, title } = fileData;
      console.log('type of documentData', documentData.type);
      console.log('initialData of documentData', documentData.initialData);
      const bytes = await getMultipleFiles({
        type: documentData.type,
        data: documentData.initialData,
      });

      // Determine MIME type
      let contentType = '';

      if (!contentType && title) {
        const extension = title.split('.').pop()?.toLowerCase();
        contentType = getMimeTypeFromExtension(extension);
      }

      if (!contentType) {
        contentType = 'application/octet-stream';
      }

      const blob = new Blob([bytes], {
        type: contentType,
      });

      const basetitle = title ?? 'document';

      files.push({
        title: basetitle,
        data: blob,
      });
    }

    const zip = new JSZip();

    for (const file of files) {
      zip.file(file.title, file.data);
    }

    const zipContent = await zip.generateAsync({ type: 'blob' });

    if (zipContent) {
      const blob = new Blob([zipContent], { type: 'application/zip' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'files.zip';
      link.click();
    }

    return { success: true, message: 'Files downloaded successfully' };
  } catch (error) {
    console.error('Error downloading files:', error);
    return { success: false, message: 'Failed to download files' };
  }
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
