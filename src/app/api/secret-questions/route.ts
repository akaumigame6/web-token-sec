import { NextResponse } from "next/server";
import { prisma } from "@/libs/prisma";
import type { ApiResponse } from "@/app/_types/ApiResponse";
import type { SecretQuestion } from "@/app/_types/SecretQuestion";

// キャッシュを無効化して常に最新情報を取得
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function GET() {
  try {
    const questions = await prisma.secretQuestion.findMany({
      select: { 
        id: true, 
        question: true 
      },
      orderBy: { id: "asc" },
    });

    const res: ApiResponse<SecretQuestion[]> = {
      success: true,
      payload: questions,
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
}