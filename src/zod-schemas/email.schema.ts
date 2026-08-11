import z from 'zod';

// export const emailSchema = z.preprocess<string, z.ZodEmail, string>(
//   (val) => (typeof val === "string" ? val.trim() : val),
//   z.email({
//     error: (issue) =>
//       issue.input == null || issue.input === ""
//         ? "Email is required"
//         : "Invalid email format",
//   })
// )

export const emailSchema = z
  .email({
    error: (issue) =>
      issue.input == null || issue.input === ''
        ? 'Email is required'
        : 'Invalid email format',
  })
  .trim();
