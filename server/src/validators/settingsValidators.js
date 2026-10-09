import { z } from "zod";

export const preferencesSchema = z.object({
  body: z.object({
    soundEnabled: z.boolean().optional(),
    soundStyle: z.enum(["soft", "thock", "mechanical", "typewriter", "bubble"]).optional(),
    soundVolume: z.number().min(0).max(1).optional(),
    virtualKeyboard: z.boolean().optional(),
    handGuide: z.boolean().optional(),
    keyboardLayout: z.enum(["en", "km"]).optional(),
    fontSize: z.enum(["normal", "large"]).optional(),
    theme: z.enum(["light", "dark", "system"]).optional(),
    superGuest: z.boolean().optional(),
  }).refine((value) => Object.keys(value).length > 0),
});
