import z from 'zod';

export const scopeSchema = z.literal(['public', 'mine']).default('public');

export type Scope = z.infer<typeof scopeSchema>;
