import { randomBytes, createHmac } from 'crypto';

// CSRF トークンのシークレット（本番環境では環境変数から取得）
const CSRF_SECRET = process.env.CSRF_SECRET || 'default-csrf-secret-key';

/**
 * CSRFトークンを生成
 */
export function generateCsrfToken(): string {
  const timestamp = Date.now().toString();
  const randomValue = randomBytes(16).toString('hex');
  const payload = `${timestamp}:${randomValue}`;
  
  const hmac = createHmac('sha256', CSRF_SECRET);
  hmac.update(payload);
  const signature = hmac.digest('hex');
  
  return `${payload}:${signature}`;
}

/**
 * CSRFトークンを検証
 */
export function verifyCsrfToken(token: string): boolean {
  if (!token) return false;
  
  const parts = token.split(':');
  if (parts.length !== 3) return false;
  
  const [timestamp, randomValue, signature] = parts;
  const payload = `${timestamp}:${randomValue}`;
  
  // タイムスタンプ検証（1時間以内）
  const tokenTime = parseInt(timestamp);
  const currentTime = Date.now();
  const oneHour = 60 * 60 * 1000;
  
  if (currentTime - tokenTime > oneHour) {
    return false;
  }
  
  // HMAC検証
  const hmac = createHmac('sha256', CSRF_SECRET);
  hmac.update(payload);
  const expectedSignature = hmac.digest('hex');
  
  return signature === expectedSignature;
}

/**
 * CSRFトークンをCookieに設定
 */
export function setCsrfTokenCookie(response: Response, token: string): void {
  // HttpOnlyではなくJavaScriptからアクセス可能にする（Double Submit Cookieパターン）
  const cookieValue = `csrfToken=${token}; Path=/; SameSite=Strict; Secure=${process.env.NODE_ENV === 'production'}`;
  response.headers.append('Set-Cookie', cookieValue);
}

/**
 * リクエストからCSRFトークンを取得
 */
export function getCsrfTokenFromRequest(request: Request): string | null {
  // ヘッダーから取得
  const headerToken = request.headers.get('X-CSRF-Token');
  if (headerToken) return headerToken;
  
  // Cookieから取得
  const cookieHeader = request.headers.get('Cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map(c => c.trim());
    const csrfCookie = cookies.find(c => c.startsWith('csrfToken='));
    if (csrfCookie) {
      return csrfCookie.split('=')[1];
    }
  }
  
  return null;
}
