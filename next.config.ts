import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  
  // セキュリティヘッダーの設定
  async headers() {
    return [
      {
        // すべてのルートにセキュリティヘッダーを適用
        source: '/(.*)',
        headers: [
          // Content Security Policy - XSS攻撃対策（強化版）
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'", // Nextjs開発時に必要、本番では削除推奨
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", // Tailwind + Google Fonts対応
              "img-src 'self' data: blob: https:",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' ws: wss:", // WebSocket for hot reload
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'", // Flash等のオブジェクト禁止
              "media-src 'self'", // 音声・動画ファイル制限
              "worker-src 'self'", // Web Worker制限
              "child-src 'none'", // iframe等の子フレーム禁止
              "upgrade-insecure-requests" // HTTP→HTTPS自動アップグレード
            ].join('; ')
          },
          // クリックジャッキング対策
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          // MIME タイプスニッフィング対策
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // XSS フィルター有効化
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          // リファラー制御
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          // 権限ポリシー
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ];
  }
};

export default nextConfig;
