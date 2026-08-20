import z from 'zod';
import { zfd } from 'zod-form-data';
import { CustomFileSystemStoredFile } from '../form-data-config/form-data-config.module';

export const imageFileSchema = zfd.file(
  z
    .instanceof(CustomFileSystemStoredFile)
    .refine((file) => file.mimetype.startsWith('image/'), {
      message: 'Only image files are accepted',
    })
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: 'Image must be less than 5MB',
    }),
);
