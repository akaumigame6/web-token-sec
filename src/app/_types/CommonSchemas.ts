import { z } from "zod";
import { Role } from "./Role";

// 文字列のすべてが ASCII 範囲内（英数字・記号・半角スペースなど）で構成されているか
const asciiOnly = /^[\x00-\x7F]*$/;
export const passwordSchema = z
  .string()
  .min(8, "パスワードは8文字以上で入力してください")
  .regex(asciiOnly, "パスワードは半角文字のみ使用できます");
export const emailSchema = z.string().email("有効なメールアドレスを入力してください");
export const userNameSchema = z.string().min(1, "名前を入力してください");
export const roleSchema = z.nativeEnum(Role);

// prettier-ignore
export const isUUID = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export const uuidSchema = z.string().refine(isUUID, {
  message: "Invalid UUID format.",
});

export const aboutContentSchema = z.string().min(0).max(1000);
export const aboutSlugSchema = z
  .string()
  .transform((value) => (value === "" ? null : value))
  .nullable()
  .refine(
    (val) =>
      val === null ||
      (val.length >= 4 && val.length <= 16 && /^[a-z0-9-]+$/.test(val)),
    {
      message: "4〜16文字の英小文字・数字・ハイフンのみ使用できます",
    },
  );
