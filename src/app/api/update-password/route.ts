import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/libs/prisma";
import { verifyJwt } from "@/app/api/_helper/verifyJwt";
import type { ApiResponse } from "@/app/_types/ApiResponse";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { jwtVerify } from "jose";

// キャッシュを無効化して常に最新情報を取得
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

// リクエストボディのスキーマ
const updatePasswordSchema = z.object({
  newPassword: z.string().min(8, "パスワードは8文字以上で入力してください"),
});

// リセットトークンを検証する関数
const verifyResetToken = async (token: string): Promise<{ userId: string; email: string } | null> => {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    
    // トークンの目的を確認
    if (payload.type !== "password-reset") {
      return null;
    }
    
    return {
      userId: payload.userId as string,
      email: payload.email as string,
    };
  } catch (error) {
    return null;
  }
};

export const POST = async (req: NextRequest) => {
  try {
    // リセットトークンの検証（優先）
    const resetToken = req.headers.get("X-Reset-Token");
    let userId: string | null = null;

    if (resetToken) {
      // リセットトークンからユーザーIDを取得
      const resetTokenPayload = await verifyResetToken(resetToken);
      if (!resetTokenPayload) {
        const res: ApiResponse<null> = {
          success: false,
          payload: null,
          message: "パスワードリセットトークンが無効または期限切れです。再度本人確認を行ってください。",
        };
        return NextResponse.json(res);
      }
      userId = resetTokenPayload.userId;
    } else {
      // リセットトークンがない場合は通常のJWT認証を試行
      userId = await verifyJwt(req);
      if (!userId) {
        const res: ApiResponse<null> = {
          success: false,
          payload: null,
          message: "認証情報が無効です。ログインするかパスワードリセットを行ってください。",
        };
        return NextResponse.json(res);
      }
    }

    // リクエストボディの検証
    const body = await req.json();
    const result = updatePasswordSchema.safeParse(body);
    if (!result.success) {
      const res: ApiResponse<null> = {
        success: false,
        payload: null,
        message: "リクエストボディの形式が不正です。",
      };
      return NextResponse.json(res);
    }

    const { newPassword } = result.data;

    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
      },
    });

    if (!user) {
      const res: ApiResponse<null> = {
        success: false,
        payload: null,
        message: "ユーザーが見つかりません。",
      };
      return NextResponse.json(res);
    }

    // 新しいパスワードをハッシュ化
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // パスワードを更新
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedNewPassword,
      },
    });

    const res: ApiResponse<null> = {
      success: true,
      payload: null,
      message: "パスワードが正常に更新されました。",
    };
    return NextResponse.json(res);
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : "Internal Server Error";
    console.error(errorMsg);
    const res: ApiResponse<null> = {
      success: false,
      payload: null,
      message: "パスワードの更新でサーバーエラーが発生しました。",
    };
    return NextResponse.json(res);
  }
};
