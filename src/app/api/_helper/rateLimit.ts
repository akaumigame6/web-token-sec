/**
 * レート制限機能
 * メモリベースの簡易実装（本番環境ではRedis等を使用推奨）
 */

interface RateLimitData {
  count: number;
  resetTime: number;
}

// メモリベースのストレージ（開発用）
const rateLimitStore = new Map<string, RateLimitData>();

export interface RateLimitConfig {
  windowMs: number; // 時間枠（ミリ秒）
  maxRequests: number; // 最大リクエスト数
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

/**
 * レート制限チェック
 */
export function checkRateLimit(
  identifier: string, 
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const key = identifier;
  
  // 既存データを取得
  let data = rateLimitStore.get(key);
  
  // データが存在しない、または期限切れの場合は初期化
  if (!data || now >= data.resetTime) {
    data = {
      count: 0,
      resetTime: now + config.windowMs
    };
  }
  
  // リクエスト数をインクリメント
  data.count++;
  rateLimitStore.set(key, data);
  
  // 制限チェック
  const allowed = data.count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - data.count);
  
  const result: RateLimitResult = {
    allowed,
    remaining,
    resetTime: data.resetTime
  };
  
  if (!allowed) {
    result.retryAfter = Math.ceil((data.resetTime - now) / 1000);
  }
  
  return result;
}

/**
 * レート制限のクリーンアップ（期限切れエントリの削除）
 */
export function cleanupRateLimit(): void {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now >= data.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * クライアントIPアドレスを取得
 */
export function getClientIP(request: Request): string {
  // プロキシ経由の場合のIPアドレス取得
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  // 開発環境用のフォールバック
  return 'unknown-ip';
}

// 事前定義されたレート制限設定
export const RATE_LIMITS = {
  // ログイン試行制限
  LOGIN: {
    windowMs: 15 * 60 * 1000, // 15分
    maxRequests: 5 // 5回まで
  },
  // パスワードリセット制限
  PASSWORD_RESET: {
    windowMs: 60 * 60 * 1000, // 1時間
    maxRequests: 3 // 3回まで
  },
  // サインアップ制限
  SIGNUP: {
    windowMs: 60 * 60 * 1000, // 1時間
    maxRequests: 5 // 5回まで
  },
  // 一般API制限
  GENERAL: {
    windowMs: 60 * 1000, // 1分
    maxRequests: 60 // 60回まで
  }
} as const;

// 定期クリーンアップの設定
setInterval(cleanupRateLimit, 60 * 60 * 1000); // 1時間ごと
