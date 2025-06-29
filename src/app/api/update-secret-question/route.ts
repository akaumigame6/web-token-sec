import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { verifyJwt } from "@/app/api/_helper/verifyJwt";
import type { ApiResponse } from "@/app/_types/ApiResponse";
import { z } from "zod";

const prisma = new PrismaClient();

// キャッシュを無効化して常に最新情報を取得
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

// リクエストボディのスキーマ
const updateSecretQuestionSchema = z.object({
  secretQuestionId: z.number().min(1, "秘密の質問を選択してください"),
  secretAnswer: z.string().min(1, "秘密の質問の答えを入力してください"),
  currentPassword: z.string().min(1, "現在のパスワードを入力してください"),
});

// 秘密の質問を更新（ログインユーザーのみ）
export async function PUT(request: NextRequest): Promise<NextResponse<ApiResponse<null>>> {
  try {
    // JWTトークンの検証（必須）
    const userId = await verifyJwt(request);
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          payload: null,
          message: "認証が必要です。ログインしてください。",
        },
        { status: 401 }
      );
    }

    // リクエストボディの検証
    const body = await request.json();
    const result = updateSecretQuestionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          payload: null,
          message: "入力内容に誤りがあります。",
        },
        { status: 400 }
      );
    }

    const { secretQuestionId, secretAnswer, currentPassword } = result.data;

    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
        secretQuestionId: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          payload: null,
          message: "ユーザーが見つかりません。",
        },
        { status: 404 }
      );
    }

    // 現在のパスワードを検証
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          payload: null,
          message: "現在のパスワードが正しくありません。",
        },
        { status: 401 }
      );
    }

    // 選択された秘密の質問が存在するかチェック
    const secretQuestion = await prisma.secretQuestion.findUnique({
      where: { id: secretQuestionId },
    });

    if (!secretQuestion) {
      return NextResponse.json(
        {
          success: false,
          payload: null,
          message: "選択された秘密の質問が見つかりません。",
        },
        { status: 400 }
      );
    }

    // 秘密の質問の答えをハッシュ化
    const hashedAnswer = await bcrypt.hash(secretAnswer, 10);

    // 秘密の質問と答えを更新
    await prisma.user.update({
      where: { id: userId },
      data: {
        secretQuestionId: secretQuestionId,
        secretAnswer: hashedAnswer,
      },
    });

    return NextResponse.json({
      success: true,
      payload: null,
      message: "秘密の質問が正常に更新されました。",
    });
  } catch (error) {
    console.error("API Error (update-secret-question):", error);
    return NextResponse.json(
      {
        success: false,
        payload: null,
        message: "サーバーエラーが発生しました。",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
