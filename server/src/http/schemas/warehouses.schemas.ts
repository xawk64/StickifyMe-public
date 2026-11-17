import { z } from "zod";

const settingsItem = z.object({
  ID: z.number().int().positive(),
  boxTypes: z.array(z.string().max(100)).max(20),
  coeff: z.number().min(0).max(100),
  dateStart: z.coerce.date(),
  dateEnd: z.coerce.date(),
});

const saveSettings = z.object({
  settings: z.object({
    enabled: z.boolean(),
    items: z.array(settingsItem).max(200),
  }),
});

export { saveSettings };
