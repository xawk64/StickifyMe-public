import { z } from "zod";

// Only these fields may be changed by the user; everything else is stripped.
const updateProfile = z.object({
  fullName: z.string().trim().min(1).max(100).optional(),
});

const setWbApiKey = z.object({ apiKey: z.string().trim().min(10).max(4096) });

export { updateProfile, setWbApiKey };
