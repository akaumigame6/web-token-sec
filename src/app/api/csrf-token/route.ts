import { NextRequest, NextResponse } from 'next/server';
import { generateCsrfToken, setCsrfTokenCookie } from '../_helper/csrfToken';

/**
 * CSRFトークン取得API
 */
export async function GET(request: NextRequest) {
  try {
    // CSRFトークンを生成
    const csrfToken = generateCsrfToken();
    
    const response = NextResponse.json(
      { 
        success: true, 
        csrfToken,
        message: 'CSRFトークンを発行しました'
      },
      { status: 200 }
    );
    
    // CSRFトークンをCookieにも設定（Double Submit Cookieパターン）
    setCsrfTokenCookie(response, csrfToken);
    
    return response;
  } catch (error) {
    console.error('CSRF token generation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'CSRFトークンの生成に失敗しました' 
      },
      { status: 500 }
    );
  }
}
