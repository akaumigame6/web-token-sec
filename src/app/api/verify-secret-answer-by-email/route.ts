import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import type { ApiResponse } from "@/app/_types/ApiResponse";

const prisma = new PrismaClient();

// メールアドレスを指定して秘密の質問の答えを検証し、パスワードリセットトークンを発行
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<{ resetToken: string }>>> {
  try {
    const { email, secretAnswer } = await request.json();

    if (!email || !secretAnswer) {
      return NextResponse.json(
        {
          success: false,
          payload: { resetToken: "" },
          message: "メールアドレスと秘密の質問の答えが必要です",
        },
        { status: 400 }
      );
    }

    // ユーザーを取得
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          payload: { resetToken: "" },
          message: "指定されたメールアドレスのユーザーが見つかりません",
        },
        { status: 404 }
      );
    }

    // 秘密の質問の答えを検証
    const isAnswerValid = await bcrypt.compare(secretAnswer, user.secretAnswer);

    if (!isAnswerValid) {
      return NextResponse.json(
        {
          success: false,
          payload: { resetToken: "" },
          message: "秘密の質問の答えが正しくありません",
        },
        { status: 401 }
      );
    }

    // パスワードリセット用の時間制限付きJWTトークンを生成（10分間有効）
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const resetToken = await new SignJWT({
      userId: user.id,
      type: "password-reset",
      email: user.email,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("10m")
      .sign(secret);

    return NextResponse.json({
      success: true,
      payload: { resetToken },
      message: "秘密の質問の答えが正しく確認されました。パスワードリセットトークンを発行しました。",
    });
  } catch (error) {
    console.error("API Error (verify-secret-answer-by-email):", error);
    return NextResponse.json(
      {
        success: false,
        payload: { resetToken: "" },
        message: "サーバーエラーが発生しました",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
