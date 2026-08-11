import z from 'zod';

export const mobileSchema = z
  .string({
    error: (issue) =>
      issue.input == null
        ? 'Mobile number is required'
        : 'Mobile number must be a string',
  })
  .trim()
  .min(1, 'Mobile number is required')
  // Allows optional '+', followed by 7 to 15 digits (E.164 standard)
  .regex(
    /^\+?[0-9]{7,15}$/,
    'Please enter a valid mobile number (e.g., +1234567890 or 03000000000)',
  )
  // Optional: Specific check to ensure it's not just a string of zeros
  .refine((val) => !/^0+$/.test(val.replace(/\D/g, '')), {
    message: 'Mobile number cannot be all zeros',
  });
