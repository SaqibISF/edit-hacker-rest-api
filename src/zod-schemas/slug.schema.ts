import z from 'zod';

export const slugSchema = z
  .string()
  .toLowerCase()
  .trim()
  .min(2, 'Slug must be at least 2 characters long')
  .max(30, 'Slug must be less than 30 characters long')
  .regex(
    /^[a-zA-Z0-9-]+$/,
    'Slug must contain only letters, numbers, and hyphens',
  );
