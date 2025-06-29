"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TextInputField } from "@/app/_components/TextInputField";
import { ErrorMsgField } from "@/app/_components/ErrorMsgField";
import { Button } from "@/app/_components/Button";
import { useAuth } from "@/app/_hooks/useAuth";
import { useRouter } from "next/navigation";
import { faLock, faSpinner, faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { ApiResponse } from "@/app/_types/ApiResponse";
import zxcvbn from "zxcvbn";

// パスワード更新フォームのスキーマ
const updatePasswordSchema = z.object({
  newPassword: z.string().min(8, "パスワードは8文字以上で入力してください"),
  confirmPassword: z.string().min(1, "確認用パスワードを入力してください"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  path: ["confirmPassword"],
  message: "パスワードが一致しません",
});

type UpdatePasswordForm = z.infer<typeof updatePasswordSchema>;

const Page: React.FC = () => {
  const { userProfile, logout } = useAuth();
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<string | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState("");
  const [confirmPasswordValue, setConfirmPasswordValue] = useState(""); // 確認用パスワードの値を管理
  const [isResetMode, setIsResetMode] = useState(false); // リセットモードかどうか

  // フォーム処理関連の準備と設定
  const formMethods = useForm<UpdatePasswordForm>({
    mode: "onChange",
    resolver: zodResolver(updatePasswordSchema),
  });
  const fieldErrors = formMethods.formState.errors;

  // ルートエラー（サーバサイドで発生したエラー）の表示設定の関数
  const setRootError = (errorMsg: string) => {
    formMethods.setError("root", {
      type: "manual",
      message: errorMsg,
    });
  };

  // 入力フィールドの値が変更されたときにルートエラーをクリア
  const clearRootErrorOnChange = () => {
    if (formMethods.formState.errors.root) {
      formMethods.clearErrors("root");
    }
  };

  // アクセス権限チェック
  useEffect(() => {
    // リセットトークンをチェック
    const resetToken = sessionStorage.getItem("resetToken") || sessionStorage.getItem("passwordResetToken");
    
    if (resetToken) {
      // リセットモード（ログイン不要）
      setIsResetMode(true);
    } else if (!userProfile) {
      // ログインもリセットトークンもない場合はログインページに遷移
      router.replace("/login");
      return;
    } else {
      // 通常のログインユーザーがパスワード変更する場合（既存の動作維持）
      setIsResetMode(false);
    }
  }, [userProfile, router]);

  // パスワード入力に応じて強度を評価する
  useEffect(() => {
    if (newPasswordValue) {
      const result = zxcvbn(newPasswordValue);
      const label = ["とても弱い", "弱い", "普通", "強い", "とても強い"][result.score];
      setPasswordStrength(label);
    } else {
      setPasswordStrength(null);
    }
  }, [newPasswordValue]);

  // 更新完了後のリダイレクト処理
  useEffect(() => {
    if (isCompleted) {
      const timer = setTimeout(async () => {
        // リセットトークンを削除
        sessionStorage.removeItem("resetToken");
        sessionStorage.removeItem("passwordResetToken");
        sessionStorage.removeItem("resetEmail");
        
        if (isResetMode) {
          // リセットモードの場合はログインページに遷移
          router.replace("/login?message=password-updated");
        } else {
          // 通常モードの場合はログアウト後ログインページに遷移
          await logout();
          router.replace("/login?message=password-updated");
        }
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isCompleted, logout, router, isResetMode]);

  // フォームの送信処理
  const onSubmit = async (formValues: UpdatePasswordForm) => {
    try {
      setIsPending(true);
      formMethods.clearErrors("root");

      const resetToken = sessionStorage.getItem("resetToken") || sessionStorage.getItem("passwordResetToken");
      
      // ヘッダーの準備
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // リセットトークンがある場合は追加
      if (resetToken) {
        headers["X-Reset-Token"] = resetToken;
      }

      // 通常のログインユーザーの場合はJWTトークンを追加
      if (!isResetMode && userProfile) {
        const jwt = localStorage.getItem("jwt");
        if (jwt) {
          headers["Authorization"] = `Bearer ${jwt}`;
        }
      }

      const res = await fetch("/api/update-password", {
        method: "POST",
        headers,
        body: JSON.stringify({
          newPassword: formValues.newPassword,
        }),
      });

      const data: ApiResponse<null> = await res.json();
      
      if (data.success) {
        setIsCompleted(true);
      } else {
        setRootError(data.message || "パスワードの更新に失敗しました。");
        
        // トークンが無効な場合の処理
        if (data.message?.includes("トークン") || data.message?.includes("認証")) {
          sessionStorage.removeItem("resetToken");
          sessionStorage.removeItem("passwordResetToken");
          setTimeout(() => {
            if (isResetMode) {
              router.push("/password-reset");
            } else {
              router.push("/secretQuestion");
            }
          }, 2000);
        }
      }
    } catch (error) {
      setRootError("サーバーエラーが発生しました。しばらく時間をおいて再度お試しください。");
    } finally {
      setIsPending(false);
    }
  };

  // ログインしていない場合で、かつリセットモードでもない場合の表示
  if (!userProfile && !isResetMode) {
    return null;
  }

  // 更新完了後の表示
  if (isCompleted) {
    return (
      <main className="max-w-md mx-auto text-center">
        <div className="text-2xl font-bold mb-6 text-green-600">
          <FontAwesomeIcon icon={faCheckCircle} className="mr-1.5" />
          パスワード更新完了
        </div>

        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800 mb-2">
            パスワードが正常に更新されました。
          </p>
          <p className="text-sm text-green-600">
            セキュリティのため、新しいパスワードで再度ログインしてください。
          </p>
        </div>

        <div className="flex items-center justify-center gap-x-2 text-gray-600">
          <FontAwesomeIcon icon={faSpinner} spin />
          <span>3秒後にログインページに移動します...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto">
      <div className="text-2xl font-bold mb-6">
        <FontAwesomeIcon icon={faLock} className="mr-1.5" />
        {isResetMode ? "パスワードリセット" : "パスワード更新"}
      </div>

      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800 mb-2">
          {isResetMode 
            ? "本人確認が完了しました。新しいパスワードを設定してください。"
            : "本人確認が完了しました。新しいパスワードを設定してください。"
          }
        </p>
        <p className="text-sm text-blue-600">
          安全なパスワードを設定することをお勧めします。
        </p>
      </div>

      <form
        noValidate
        onSubmit={formMethods.handleSubmit(onSubmit)}
        className="flex flex-col gap-y-4"
      >
        <div>
          <label htmlFor="newPassword" className="mb-2 block font-bold">
            新しいパスワード
          </label>
          <TextInputField
            {...formMethods.register("newPassword")}
            id="newPassword"
            placeholder="新しいパスワードを入力してください"
            type="password"
            disabled={isPending}
            error={!!fieldErrors.newPassword}
            autoComplete="new-password"
            onChange={(e) => {
              const value = e.target.value;
              setNewPasswordValue(value);
              formMethods.setValue("newPassword", value);
              clearRootErrorOnChange();
            }}
          />
          <ErrorMsgField msg={fieldErrors.newPassword?.message} />
          
          {/* パスワード強度の表示 */}
          {passwordStrength && (
            <p
              className={`mt-1 text-sm ${
                passwordStrength.includes("とても強い") || passwordStrength.includes("強い")
                  ? "text-green-600"
                  : passwordStrength.includes("普通")
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}
            >
              パスワード強度: {passwordStrength}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-2 block font-bold">
            確認用パスワード
          </label>
          <TextInputField
            {...formMethods.register("confirmPassword")}
            id="confirmPassword"
            placeholder="もう一度新しいパスワードを入力してください"
            type="password"
            disabled={isPending}
            error={!!fieldErrors.confirmPassword}
            autoComplete="new-password"
            onChange={(e) => {
              const value = e.target.value;
              setConfirmPasswordValue(value);
              formMethods.setValue("confirmPassword", value);
              clearRootErrorOnChange();
            }}
          />
          <ErrorMsgField msg={fieldErrors.confirmPassword?.message} />
        </div>

        <ErrorMsgField msg={fieldErrors.root?.message} />

        <div className="flex gap-x-4">
          <Button
            type="button"
            variant="indigo"
            width="stretch"
            onClick={() => router.push("/secretQuestion")}
            disabled={isPending}
            className="bg-gray-500 hover:bg-gray-600"
          >
            戻る
          </Button>
          <Button
            type="submit"
            variant="indigo"
            width="stretch"
            disabled={
              newPasswordValue.trim().length < 8 || 
              confirmPasswordValue.trim().length === 0 || 
              newPasswordValue !== confirmPasswordValue || 
              isPending
            }
          >
            {isPending ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                更新中...
              </>
            ) : (
              "パスワードを更新"
            )}
          </Button>
        </div>
      </form>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>セキュリティに関する注意:</strong><br />
          • パスワードは8文字以上で設定してください<br />
          • 英数字と記号を組み合わせることをお勧めします<br />
          • 更新後は自動的にログアウトされます
        </p>
      </div>
    </main>
  );
};

export default Page;
