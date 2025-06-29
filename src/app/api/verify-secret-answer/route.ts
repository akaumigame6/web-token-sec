import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/libs/prisma";
import { verifyJwt } from "@/app/api/_helper/verifyJwt";
import type { ApiResponse } from "@/app/_types/ApiResponse";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { SignJWT } from "jose";

// キャッシュを無効化して常に最新情報を取得
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

// リクエストボディのスキーマ
const verifyAnswerSchema = z.object({
  answer: z.string().min(1, "答えを入力してください"),
});

export const POST = async (req: NextRequest) => {
  try {
    // JWTトークンの検証
    const userId = await verifyJwt(req);
    if (!userId) {
      const res: ApiResponse<null> = {
        success: false,
        payload: null,
        message: "認証情報が無効です。再度ログインしてください。",
      };
      return NextResponse.json(res);
    }

    // リクエストボディの検証
    const body = await req.json();
    const result = verifyAnswerSchema.safeParse(body);
    if (!result.success) {
      const res: ApiResponse<null> = {
        success: false,
        payload: null,
        message: "リクエストボディの形式が不正です。",
      };
      return NextResponse.json(res);
    }

    const { answer } = result.data;

    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        secretAnswer: true,
      },
    });

    if (!user || !user.secretAnswer) {
      const res: ApiResponse<null> = {
        success: false,
        payload: null,
        message: "秘密の質問が設定されていません。",
      };
      return NextResponse.json(res);
    }

    // 答えの検証
    const isValidAnswer = await bcrypt.compare(answer, user.secretAnswer);
    if (!isValidAnswer) {
      const res: ApiResponse<null> = {
        success: false,
        payload: null,
        message: "答えが正しくありません。",
      };
      return NextResponse.json(res);
    }

    // 時間制限付きのパスワードリセットトークンを生成（15分有効）
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15分後

    const resetTokenPayload = {
      userId: user.id,
      email: user.email,
      purpose: "password-reset",
      iat: Math.floor(Date.now() / 1000),
    };
    
    const resetToken = await new SignJWT(resetTokenPayload)
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(expiresAt)
      .sign(secret);

    const res: ApiResponse<{ resetToken: string }> = {
      success: true,
      payload: { resetToken },
      message: "本人確認が完了しました。",
    };
    return NextResponse.json(res);
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : "Internal Server Error";
    console.error(errorMsg);
    const res: ApiResponse<null> = {
      success: false,
      payload: null,
      message: "サーバーエラーが発生しました。",
    };
    return NextResponse.json(res);
  }
};
