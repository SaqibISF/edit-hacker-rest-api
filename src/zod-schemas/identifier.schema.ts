import z from 'zod';
import { objectIdSchema } from './objectId.schema';
import { slugSchema } from './slug.schema';

export const identifierSchema = z.union([objectIdSchema, slugSchema]);
