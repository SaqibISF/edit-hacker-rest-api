import { CustomFileSystemStoredFile } from '../form-data-config/form-data-config.module';
import z from 'zod';
import { zfd } from 'zod-form-data';

export const avatarSchema = zfd.formData({
  avatar: zfd.file(
    z
      .instanceof(CustomFileSystemStoredFile)
      .refine((file) => file.mimetype.startsWith('image/'), {
        message: 'Only image files are accepted',
      })
      .refine((file) => file.size <= 5 * 1024 * 1024, {
        message: 'Image must be less than 5MB',
      }),
  ),
});

export type AvatarDto = z.infer<typeof avatarSchema>;
