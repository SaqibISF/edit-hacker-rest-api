import fs from 'fs';

export const removeFileFromStorage = (fileUrl?: string) => {
  if (!fileUrl) return;

  const filePath = `public\\uploads\\${new URL(fileUrl).pathname}`;

  void fs.promises.unlink(filePath).catch((err: NodeJS.ErrnoException) => {
    if (err.code !== 'ENOENT') {
      console.error(`Failed to delete file at ${filePath}:`, err);
    }
  });
};

export const removeFilesFromStorage = (fileUrls?: string[]) =>
  fileUrls?.forEach(removeFileFromStorage);
