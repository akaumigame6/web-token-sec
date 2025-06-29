import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import type { ApiResponse } from "@/app/_types/ApiResponse";
import type { SecretQuestion } from "@/app/_types/SecretQuestion";

const prisma = new PrismaClient();

// メールアドレスを指定してユーザーの秘密の質問を取得
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<SecretQuestion>>> {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          payload: {} as SecretQuestion,
          message: "メールアドレスが指定されていません",
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
          payload: {} as SecretQuestion,
          message: "指定されたメールアドレスのユーザーが見つかりません",
        },
        { status: 404 }
      );
    }

    // 秘密の質問を取得
    const secretQuestion = await prisma.secretQuestion.findUnique({
      where: { id: user.secretQuestionId },
    });

    if (!secretQuestion) {
      return NextResponse.json(
        {
          success: false,
          payload: {} as SecretQuestion,
          message: "このユーザーには秘密の質問が設定されていません",
        },
        { status: 404 }
      );
    }

    const result: SecretQuestion = {
      id: secretQuestion.id,
      question: secretQuestion.question,
    };

    return NextResponse.json({
      success: true,
      payload: result,
      message: "秘密の質問を取得しました",
    });
  } catch (error) {
    console.error("API Error (user-secret-question-by-email):", error);
    return NextResponse.json(
      {
        success: false,
        payload: {} as SecretQuestion,
        message: "サーバーエラーが発生しました",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
