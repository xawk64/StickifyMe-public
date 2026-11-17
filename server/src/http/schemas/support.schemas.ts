import { z } from "zod";

const feedback = z.object({
  type: z.enum(["problem", "feature", "review"]),
  message: z.string().trim().min(1).max(5000),
});

export { feedback };
