import { Types } from 'mongoose';
import { z } from 'zod';

export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId')
  .transform((str) => new Types.ObjectId(str));
