import { z } from "zod";
import {
  userNameSchema,
  emailSchema,
  passwordSchema,
  roleSchema,
  aboutSlugSchema,
  aboutContentSchema,
} from "./CommonSchemas";

export const userSeedSchema = z.object({
  name: userNameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: roleSchema,
  aboutSlug: aboutSlugSchema.optional(),
  aboutContent: aboutContentSchema.optional(),
  secretQuestionId: z.number().int().min(1), // シークレット質問のID（1〜）
  secretAnswer: z.string().min(1), // シークレット質問の回答（1〜文字）
});

export type UserSeed = z.infer<typeof userSeedSchema>;
