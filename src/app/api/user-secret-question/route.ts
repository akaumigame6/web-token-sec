import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/libs/prisma";
import { verifyJwt } from "@/app/api/_helper/verifyJwt";
import type { ApiResponse } from "@/app/_types/ApiResponse";
import type { SecretQuestion } from "@/app/_types/SecretQuestion";

// キャッシュを無効化して常に最新情報を取得
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export const GET = async (req: NextRequest) => {
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

    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        secretQuestionId: true,
      },
    });

    if (!user || !user.secretQuestionId) {
      const res: ApiResponse<null> = {
        success: false,
        payload: null,
        message: "秘密の質問が設定されていません。",
      };
      return NextResponse.json(res);
    }

    // 秘密の質問を取得
    const secretQuestion = await prisma.secretQuestion.findUnique({
      where: { id: user.secretQuestionId },
      select: {
        id: true,
        question: true,
      },
    });

    if (!secretQuestion) {
      const res: ApiResponse<null> = {
        success: false,
        payload: null,
        message: "秘密の質問が見つかりません。",
      };
      return NextResponse.json(res);
    }

    const res: ApiResponse<SecretQuestion> = {
      success: true,
      payload: secretQuestion,
      message: "",
    };
    return NextResponse.json(res);
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : "Internal Server Error";
    console.error(errorMsg);
    const res: ApiResponse<null> = {
      success: false,
      payload: null,
      message: "秘密の質問の取得に失敗しました。",
    };
    return NextResponse.json(res);
  }
};
