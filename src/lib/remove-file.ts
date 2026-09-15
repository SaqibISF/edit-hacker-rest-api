import fs from 'fs';
import path from 'path';

export const removeFileFromStorage = (fileUrl?: string) => {
  if (!fileUrl) return;

  try {
    const pathname = new URL(fileUrl).pathname;
    const filename = path.basename(pathname);
    const filePath = path.join(process.cwd(), 'public', 'uploads', filename);

    void fs.promises.unlink(filePath).catch((err: NodeJS.ErrnoException) => {
      if (err.code !== 'ENOENT') {
        console.error(`Failed to delete file at ${filePath}:`, err);
      }
    });
  } catch (error) {
    console.error(`Invalid stored file URL: ${fileUrl}`, error);
  }
};

export const removeFilesFromStorage = (fileUrls?: string[]) =>
  fileUrls?.forEach(removeFileFromStorage);
