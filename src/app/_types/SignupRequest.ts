import { z } from "zod";
import {
  userNameSchema,
  emailSchema,
  passwordSchema,
} from "@/app/_types/CommonSchemas";

export const signupRequestSchema = z.object({
  name: userNameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(), // UI専用
  secretQuestionId: z.number().min(1, "秘密の質問を選択してください"),
  secretAnswer: z.string().min(1, "答えを入力してください"),
}).refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "パスワードが一致しません",
  });

export type SignupRequest = z.infer<typeof signupRequestSchema>;
