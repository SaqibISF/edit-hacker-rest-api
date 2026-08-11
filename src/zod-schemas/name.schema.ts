import z from 'zod';

export const nameSchema = z
  .string({
    error: (issue) =>
      issue.input == null ? 'Name is required' : 'Name must be a string',
  })
  .trim()
  .min(3, 'Name must be at least 3 characters long')
  .max(20, 'Name cannot exceed 20 characters')
  .regex(
    /^[a-zA-Z_]/,
    'Name must start with a letter (a-z, A-Z) or an underscore (_)',
  )
  .regex(
    /^[a-zA-Z. _-]+$/,
    'Name can only include letters, dots (.), hyphens (-), and underscores (_)',
  )
  .refine((val) => !/[.-]$/.test(val), {
    message: 'Name cannot end with a dot (.) or hyphen (-)',
  })
  .refine((val) => !/(\.\.|--)/.test(val), {
    message: 'Name cannot contain consecutive dots (..) or hyphens (--)',
  })
  .refine((val) => !/(\.-|-\.)/.test(val), {
    message:
      "Name cannot have mixed consecutive special characters like '.-' or '-.'",
  });
