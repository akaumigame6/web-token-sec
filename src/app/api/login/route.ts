import { prisma } from "@/libs/prisma";
import { loginRequestSchema } from "@/app/_types/LoginRequest";
import type { ApiResponse } from "@/app/_types/ApiResponse";
import { NextResponse, NextRequest } from "next/server";
import { createJwt } from "@/app/api/_helper/createJwt";
import bcrypt from "bcryptjs";
import { checkRateLimit, getClientIP, RATE_LIMITS } from "@/app/api/_helper/rateLimit";
import { logSecurityEvent, getClientInfo, SECURITY_EVENTS } from "@/app/api/_helper/securityLog";

// キャッシュを無効化して毎回最新情報を取得
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export const POST = async (req: NextRequest) => {
  const { ipAddress, userAgent } = getClientInfo(req);
  
  try {
    // レート制限チェック
    const rateLimitResult = checkRateLimit(
      `login:${ipAddress}`, 
      RATE_LIMITS.LOGIN
    );
    
    if (!rateLimitResult.allowed) {
      // レート制限違反をログ
      logSecurityEvent({
        level: 'WARNING',
        event: SECURITY_EVENTS.LOGIN_RATE_LIMIT,
        ipAddress,
        userAgent,
        details: {
          retryAfter: rateLimitResult.retryAfter,
          resetTime: rateLimitResult.resetTime
        }
      });
      
      const res: ApiResponse<null> = {
        success: false,
        payload: null,
        message: `ログイン試行回数が上限に達しました。${rateLimitResult.retryAfter}秒後に再試行してください。`,
      };
      return NextResponse.json(res, { 
        status: 429,
        headers: {
          'Retry-After': String(rateLimitResult.retryAfter || 900),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': String(rateLimitResult.resetTime)
        }
      });
    }
    const result = loginRequestSchema.safeParse(await req.json());
    if (!result.success) {
      const res: ApiResponse<null> = {
        success: false,
        payload: null,
        message: "リクエストボディの形式が不正です。",
      };
      return NextResponse.json(res);
    }
    const loginRequest = result.data;

    const user = await prisma.user.findUnique({
      where: { email: loginRequest.email },
    });
    //Userが見つからなかったら
    if (!user) {
      // ログイン失敗をログ
      logSecurityEvent({
        level: 'WARNING',
        event: SECURITY_EVENTS.LOGIN_FAILURE,
        ipAddress,
        userAgent,
        details: { reason: 'user_not_found', email: loginRequest.email }
      });
      
      const res: ApiResponse<null> = {
        success: false,
        payload: null,
        message: "メールアドレスまたはパスワードの組み合わせが正しくありません。",
      };
      return NextResponse.json(res);
    }

    // パスワードの検証
    // bcrypt でハッシュ化したパスワードを検証。
    const isValidPassword = await bcrypt.compare(loginRequest.password,user.password);

    if (!isValidPassword) {
      // ログイン失敗をログ
      logSecurityEvent({
        level: 'WARNING',
        event: SECURITY_EVENTS.LOGIN_FAILURE,
        userId: user.id,
        ipAddress,
        userAgent,
        details: { reason: 'invalid_password', email: loginRequest.email }
      });
      
      const res: ApiResponse<null> = {
        success: false,
        payload: null,
        message:
          "メールアドレスまたはパスワードの組み合わせが正しくありません。",
      };
      return NextResponse.json(res);
    }

    const tokenMaxAgeSeconds = 60 * 60 * 3; // トークンの生存時間：3時間

      // ■■ トークンベース認証の処理 ■■
      const jwt = await createJwt(user, tokenMaxAgeSeconds);
      
      // ログイン成功をログ
      logSecurityEvent({
        level: 'INFO',
        event: SECURITY_EVENTS.LOGIN_SUCCESS,
        userId: user.id,
        ipAddress,
        userAgent,
        details: { email: user.email }
      });
      
      const res: ApiResponse<string> = {
        success: true,
        payload: jwt,
        message: "",
      };
      return NextResponse.json(res);
    
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : "Internal Server Error";
    console.error(errorMsg);
    
    // エラーをログ
    logSecurityEvent({
      level: 'ERROR',
      event: 'ログインAPI内部エラー',
      ipAddress,
      userAgent,
      details: { error: errorMsg }
    });
    
    const res: ApiResponse<null> = {
      success: false,
      payload: null,
      message: "ログインのサーバサイドの処理に失敗しました。",
    };
    return NextResponse.json(res);
  }
};
