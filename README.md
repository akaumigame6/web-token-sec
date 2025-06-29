# 🔐 セキュアWebアプリケーション実習

> **JWTトークンベース認証システム** - エンタープライズレベルのセキュリティを学ぶ実験プロジェクト

[![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://www.prisma.io/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.0+-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)

## 📖 概要

このプロジェクトは **ウェブアプリケーションセキュリティの実習用プラットフォーム** です。
現代的なセキュリティ要件を満たす認証システムをゼロから実装し、実践的なセキュリティ知識を習得できます。

### 🎯 学習目標
- JWTトークンベース認証の理解と実装
- CSRFやXSS等の代表的な攻撃手法とその対策
- セキュリティヘッダーとHTTPセキュリティ
- レート制限とブルートフォース攻撃対策
- セキュリティ監査とログ機能

---

## 🚀 クイックスタート

### 1️⃣ プロジェクトの取得

```bash
git clone https://github.com/akaumigame6/web-token-sec.git
cd web-token-sec
```

### 2️⃣ 依存関係のインストール

```bash
npm install
```

### 3️⃣ 環境設定

`.env` ファイルを作成し、以下を設定：

```env
DATABASE_URL="file:./app.db"
JWT_SECRET=your-super-secret-jwt-key-16chars-or-more
CSRF_SECRET=your-csrf-protection-secret-key-16chars
```

> ⚠️ **セキュリティ注意**: 実際の運用では16文字以上のランダムな文字列を使用してください

### 4️⃣ データベース初期化

```bash
npx prisma db push
npx prisma generate  
npx prisma db seed
```

### 5️⃣ 開発サーバー起動

```bash
npm run dev
# ブラウザで http://localhost:3000 を開く
```

### 🔧 その他のコマンド

```bash
# 本番ビルド & 実行
npm run build && npm start

# データベース管理画面
npx prisma studio
```

---

## 🛠️ 技術スタック

### Frontend
| 技術 | バージョン | 用途 |
|------|-----------|------|
| **Next.js** | 15.3.3 | React フレームワーク（App Router） |
| **TypeScript** | 5.0+ | 型安全性とコード品質向上 |
| **TailwindCSS** | 3.0+ | レスポンシブ・モダンUI |

### Backend & Database  
| 技術 | 用途 |
|------|------|
| **Next.js API Routes** | サーバーサイドAPI |
| **Prisma ORM** | データベース操作とマイグレーション |
| **SQLite** | 開発環境用軽量データベース |

### Security & Validation
| ライブラリ | 用途 |
|-----------|------|
| **bcryptjs** | パスワードハッシュ化（ソルト付き） |
| **jose** | JWT生成・検証 |
| **zod** | 入力値バリデーション |
| **zxcvbn** | パスワード強度評価 |

---

## ✨ 主要機能

### 🔐 認証・アカウント管理

<details>
<summary><strong>📝 ユーザー登録</strong></summary>

![ユーザー登録画面](image/Signup.png)

- ✅ メールアドレス・パスワード登録
- ✅ 秘密の質問設定（パスワードリセット用）
- ✅ リアルタイムパスワード強度評価
- ✅ 確認パスワードによるダブルチェック

</details>

<details>
<summary><strong>🔑 ログイン・ログアウト</strong></summary>

![ログイン画面](image/Login.png)

- ✅ JWT（JSON Web Token）ベース認証
- ✅ セキュアなトークン管理
- ✅ ブルートフォース攻撃対策

</details>

<details>
<summary><strong>🔄 パスワードリセット（未ログイン可）</strong></summary>

| ステップ1 | ステップ2 | ステップ3 |
|----------|----------|----------|
| ![パスワードリセット1](image/PasswordReset-1.png) | ![パスワードリセット2](image/PasswordReset-2.png) | ![パスワードリセット3](image/PasswordReset-3.png) |
| メールアドレス入力 | 秘密の質問回答 | 新パスワード設定 |

- ✅ メールアドレス + 秘密の質問による本人確認
- ✅ 時間制限付きリセットトークン（10分間有効）
- ✅ 未ログイン状態でも安全にリセット可能

</details>

### 👤 プロフィール管理

<details>
<summary><strong>📋 公開プロフィール</strong></summary>

![プロフィール画面](image/About.png)

- ✅ カスタムURL（スラッグ）での個人ページ
- ✅ About情報のリアルタイム編集・プレビュー
- ✅ 認証必須の秘密の質問変更機能

</details>

---

## 🛡️ セキュリティ機能

このプロジェクトは **エンタープライズレベルのセキュリティ** を実装しており、以下の脅威から保護されています：

### ✅ 実装済みセキュリティ対策

#### 🔒 認証・認可
- **パスワードハッシュ化**: bcryptjs使用（ソルト付き）
- **JWT署名検証**: HMAC-SHA256による改竄防止  
- **入力値検証**: Zodによる型安全なバリデーション
- **SQL インジェクション対策**: Prisma ORM による自動対策
- **認証必須API**: 重要操作での厳格なJWT検証

#### 🛡️ セキュリティヘッダー
| ヘッダー | 効果 | 設定値 |
|----------|------|--------|
| **CSP** | XSS攻撃対策 | 厳格ポリシー + HTTPS強制 |
| **X-Frame-Options** | クリックジャッキング対策 | `DENY` |
| **X-Content-Type-Options** | MIME スニッフィング対策 | `nosniff` |
| **X-XSS-Protection** | XSS フィルター | `1; mode=block` |
| **HSTS** | HTTPS強制（本番） | 2年間 + サブドメイン |
| **Permissions-Policy** | 危険API制限 | カメラ・マイク・位置情報禁止 |

#### 🚫 ブルートフォース攻撃対策
| 対象 | 制限 | 時間枠 |
|------|------|--------|
| **ログイン試行** | 5回まで | 15分間 |
| **パスワードリセット** | 3回まで | 1時間 |
| **サインアップ** | 5回まで | 1時間 |

- ✅ IPアドレス別の個別制限
- ✅ レート制限ヘッダーで残り回数通知
- ✅ 制限超過時の自動リトライ時間通知

#### 📊 セキュリティ監査
- **包括的ログ**: 全認証イベント・セキュリティ違反を記録
- **IPアドレス追跡**: プロキシ対応の正確な識別  
- **ユーザーエージェント記録**: デバイス・ブラウザ情報
- **リアルタイム監視**: 疑わしい活動の即座検知

#### 🛡️ CSRF対策
- **CSRFトークン**: 時間制限付きHMAC署名（1時間有効）
- **Double Submit Cookie**: Cookie + ヘッダーの二重検証
- **SameSite制限**: `SameSite=Strict` Cookie設定

---

### 🚧 さらなる改善の余地

#### ⚠️ 現在未実装
- **JWTブラックリスト**: トークン強制失効機能
- **MFA（多要素認証）**: SMS/TOTP認証
- **機械学習ベース不正検知**: 異常パターン自動検知
- **データベース暗号化**: 保存データのAES暗号化

#### 🔒 本格運用時の推奨事項
- **WAF導入**: アプリケーションレベル保護
- **ペネトレーションテスト**: 定期的な脆弱性診断  
- **セキュリティ監視センター**: 24/7リアルタイム監視
- **コンプライアンス**: GDPR・SOC2等の認証取得

---

## 🎓 セキュリティ学習ポイント

このプロジェクトで学べる重要なセキュリティ概念：

1. **認証vs認可**: JWTトークンの適切な活用方法
2. **OWASP Top 10**: 代表的な脆弱性とその対策実装
3. **防御の多層化**: 複数のセキュリティ対策の組み合わせ
4. **セキュリティヘッダー**: ブラウザレベルでの保護機能
5. **レート制限**: DoS・ブルートフォース攻撃対策
6. **セキュリティ監査**: ログ・監視・インシデント対応

> 💡 **実習のポイント**: 各セキュリティ機能を無効化して攻撃がどのように成功するかを確認することで、対策の重要性を体感できます。

---

## 🧪 開発・テスト環境

### 推奨開発環境
- **Node.js**: 18.0+ 
- **npm**: 8.0+
- **VSCode**: 推奨エディター
- **ブラウザ**: Chrome/Firefox最新版（開発者ツール使用）

---

## 📚 参考資料・学習リソース

### セキュリティ標準・ガイドライン
- [OWASP Top 10](https://owasp.org/www-project-top-ten/) - Webアプリケーション脆弱性トップ10
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework) - サイバーセキュリティフレームワーク
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security) - Web セキュリティリファレンス

### JWT・認証関連
- [JWT.io](https://jwt.io/) - JWT仕様とデバッガー
- [Auth0 Blog](https://auth0.com/blog/) - 認証・認可のベストプラクティス

### Next.js・React セキュリティ
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers) - セキュリティヘッダー設定
- [React Security](https://reactjs.org/docs/dom-elements.html#dangerouslysetinnerhtml) - XSS対策

---

## 🎯 免責事項

> ⚠️ **教育目的専用**: このプロジェクトは教育・学習目的で作成されています。
> 
> - **本番環境での使用**: 追加のセキュリティ監査が必要です
> - **セキュリティ保証**: 完全なセキュリティを保証するものではありません  
> - **責任範囲**: 使用による損害に対して作者は責任を負いません

**学習・実験・研究用途**でのご利用をお願いします。 🎓
