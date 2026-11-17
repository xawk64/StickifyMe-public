import { z } from "zod";

// Only these fields may be changed by the user; everything else is stripped.
const updateProfile = z.object({
  fullName: z.string().trim().min(1).max(100).optional(),
  wbApiKey: z.string().trim().max(4096).optional(),
});

export { updateProfile };
