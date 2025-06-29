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
}).refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "パスワードが一致しません",
  });;

export type SignupRequest = z.infer<typeof signupRequestSchema>;
