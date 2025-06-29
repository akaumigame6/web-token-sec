/**
 * セキュリティ監査ログ機能
 */

export interface SecurityLogEvent {
  timestamp?: Date;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  event: string;
  userId?: string;
  ipAddress: string;
  userAgent?: string;
  details?: Record<string, unknown>;
}

export interface SecurityLogEntry extends SecurityLogEvent {
  id: string;
}

// メモリベースのログストレージ（開発用）
// 本番環境では外部ログサービス（CloudWatch、Datadog等）を使用推奨
const securityLogs: SecurityLogEntry[] = [];
let logIdCounter = 1;

/**
 * セキュリティイベントをログに記録
 */
export function logSecurityEvent(event: SecurityLogEvent): void {
  const logEntry: SecurityLogEntry = {
    ...event,
    id: String(logIdCounter++),
    timestamp: new Date()
  };
  
  securityLogs.push(logEntry);
  
  // コンソールにも出力（開発用）
  const logMessage = `[SECURITY ${logEntry.level}] ${logEntry.event} - IP: ${logEntry.ipAddress}${logEntry.userId ? ` - User: ${logEntry.userId}` : ''}`;
  
  switch (logEntry.level) {
    case 'CRITICAL':
    case 'ERROR':
      console.error(logMessage, logEntry.details || '');
      break;
    case 'WARNING':
      console.warn(logMessage, logEntry.details || '');
      break;
    default:
      console.log(logMessage, logEntry.details || '');
  }
  
  // メモリ使用量制御（最新1000件のみ保持）
  if (securityLogs.length > 1000) {
    securityLogs.splice(0, securityLogs.length - 1000);
  }
}

/**
 * セキュリティログを取得（管理者用）
 */
export function getSecurityLogs(
  limit = 100,
  level?: SecurityLogEvent['level']
): SecurityLogEntry[] {
  let filteredLogs = securityLogs;
  
  if (level) {
    filteredLogs = securityLogs.filter(log => log.level === level);
  }
  
  return filteredLogs
    .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
    .slice(0, limit);
}

/**
 * リクエストからクライアント情報を取得
 */
export function getClientInfo(request: Request): {
  ipAddress: string;
  userAgent: string;
} {
  // IPアドレス取得
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const ipAddress = forwarded?.split(',')[0].trim() || realIP || 'unknown-ip';
  
  // User-Agent取得
  const userAgent = request.headers.get('user-agent') || 'unknown-user-agent';
  
  return { ipAddress, userAgent };
}

// 事前定義されたセキュリティイベント
export const SECURITY_EVENTS = {
  // 認証関連
  LOGIN_SUCCESS: 'ログイン成功',
  LOGIN_FAILURE: 'ログイン失敗',
  LOGIN_RATE_LIMIT: 'ログイン試行レート制限',
  LOGOUT: 'ログアウト',
  
  // アカウント管理
  SIGNUP_SUCCESS: 'サインアップ成功',
  SIGNUP_FAILURE: 'サインアップ失敗',
  PASSWORD_RESET_REQUEST: 'パスワードリセット要求',
  PASSWORD_RESET_SUCCESS: 'パスワードリセット成功',
  PASSWORD_CHANGE: 'パスワード変更',
  
  // セキュリティ違反
  CSRF_TOKEN_INVALID: '無効なCSRFトークン',
  JWT_TOKEN_INVALID: '無効なJWTトークン',
  RATE_LIMIT_EXCEEDED: 'レート制限超過',
  UNAUTHORIZED_ACCESS: '認証なしアクセス',
  
  // システム
  SECURITY_HEADER_VIOLATION: 'セキュリティヘッダー違反',
  SUSPICIOUS_ACTIVITY: '疑わしい活動'
} as const;
