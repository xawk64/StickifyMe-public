import { z } from "zod";

export const importFromWb = z.object({
  days: z.number().int().min(1).max(30),
});
