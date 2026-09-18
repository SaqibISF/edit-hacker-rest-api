import { z } from 'zod';
import { zfd } from 'zod-form-data';
import { CustomFileSystemStoredFile } from '../form-data-config/form-data-config.module';

export const backupFileSchema = zfd.file(
  z
    .instanceof(CustomFileSystemStoredFile)
    .refine(
      (file) => {
        const name = file.originalName.toLowerCase();
        return (
          name.endsWith('.json') ||
          name.endsWith('.json.gz') ||
          name.endsWith('.gz') ||
          file.mimetype === 'application/json' ||
          file.mimetype === 'application/gzip' ||
          file.mimetype === 'application/x-gzip' ||
          file.mimetype === 'application/octet-stream'
        );
      },
      {
        message:
          'Only JSON or GZIP backup files are accepted (.json, .json.gz)',
      },
    )
    .refine((file) => file.size <= 100 * 1024 * 1024, {
      message: 'Backup file must be less than 100MB',
    }),
);

export const createBackupSchema = z
  .object({
    collections: z
      .array(z.string().trim().min(1, 'Collection name cannot be empty'))
      .optional(),
    name: z
      .string()
      .trim()
      .max(50, 'Backup name cannot exceed 50 characters')
      .regex(
        /^[a-zA-Z0-9_-]*$/,
        'Backup name can only contain letters, numbers, hyphens, and underscores',
      )
      .optional(),
    compress: z.boolean().optional().default(false),
  })
  .strict();

export type CreateBackupDto = z.infer<typeof createBackupSchema>;

export const exportBackupSchema = z.object({
  collections: z
    .preprocess((val) => {
      if (typeof val === 'string') {
        return val
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean);
      }
      return val;
    }, z.array(z.string().trim()).optional())
    .optional(),
  compress: z.stringbool().optional(),
});

export type ExportBackupDto = z.infer<typeof exportBackupSchema>;

export const restoreModes = ['replace', 'merge'] as const;
export type RestoreMode = (typeof restoreModes)[number];

export const restoreBackupSchema = z
  .object({
    mode: z.enum(restoreModes).optional().default('replace'),
    collections: z
      .array(z.string().trim().min(1, 'Collection name cannot be empty'))
      .optional(),
  })
  .strict();

export type RestoreBackupDto = z.infer<typeof restoreBackupSchema>;

export const uploadBackupSchema = z.object({
  file: backupFileSchema,
});

export type UploadBackupDto = z.infer<typeof uploadBackupSchema>;

export const restoreUploadSchema = z.object({
  file: backupFileSchema,
  mode: z.enum(restoreModes).optional().default('replace'),
  collections: z
    .preprocess((val) => {
      if (typeof val === 'string') {
        try {
          const parsed: unknown = JSON.parse(val);
          if (Array.isArray(parsed)) {
            return parsed.filter(
              (item): item is string => typeof item === 'string',
            );
          }
        } catch {
          return val
            .split(',')
            .map((c) => c.trim())
            .filter(Boolean);
        }
      }
      return val;
    }, z.array(z.string().trim()).optional())
    .optional(),
});

export type RestoreUploadDto = z.infer<typeof restoreUploadSchema>;
