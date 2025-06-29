"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TextInputField } from "@/app/_components/TextInputField";
import { ErrorMsgField } from "@/app/_components/ErrorMsgField";
import { Button } from "@/app/_components/Button";
import { useRouter } from "next/navigation";
import { faQuestion, faSpinner, faUndo } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { ApiResponse } from "@/app/_types/ApiResponse";
import type { SecretQuestion } from "@/app/_types/SecretQuestion";

// 秘密の質問回答フォームのスキーマ
const secretAnswerSchema = z.object({
  secretAnswer: z.string().min(1, "秘密の質問への答えを入力してください"),
});

type SecretAnswerForm = z.infer<typeof secretAnswerSchema>;

const Page: React.FC = () => {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [secretQuestion, setSecretQuestion] = useState<SecretQuestion | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [answerValue, setAnswerValue] = useState("");

  // フォーム処理関連の準備と設定
  const formMethods = useForm<SecretAnswerForm>({
    mode: "onChange",
    resolver: zodResolver(secretAnswerSchema),
  });
  const fieldErrors = formMethods.formState.errors;

  // ルートエラー（サーバサイドで発生したエラー）の表示設定の関数
  const setRootError = useCallback((errorMsg: string) => {
    formMethods.setError("root", {
      type: "manual",
      message: errorMsg,
    });
  }, [formMethods]);

  // 入力フィールドの値が変更されたときにルートエラーをクリア
  const clearRootErrorOnChange = () => {
    if (formMethods.formState.errors.root) {
      formMethods.clearErrors("root");
    }
  };

  // コンポーネントマウント時にセッションストレージからメールアドレスを取得し、秘密の質問を取得
  useEffect(() => {
    const resetEmail = sessionStorage.getItem("resetEmail");
    if (!resetEmail) {
      // メールアドレスが設定されていない場合はリセット開始ページに戻る
      router.push("/password-reset");
      return;
    }

    setEmail(resetEmail);
    
    // メールアドレスに基づいて秘密の質問を取得
    const fetchSecretQuestion = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/user-secret-question-by-email?email=${encodeURIComponent(resetEmail)}`);
        const result: ApiResponse<SecretQuestion> = await response.json();

        if (!result.success) {
          setRootError(result.message || "ユーザーが見つかりません");
          return;
        }

        setSecretQuestion(result.payload);
      } catch (error) {
        setRootError("エラーが発生しました。しばらく時間をおいて再度お試しください。");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSecretQuestion();
  }, [router, setRootError]);

  // フォームの送信処理
  const onSubmit = async (formValues: SecretAnswerForm) => {
    if (!email) return;

    try {
      setIsPending(true);
      formMethods.clearErrors("root");

      // 秘密の質問の答えを検証し、パスワードリセットトークンを取得
      const response = await fetch("/api/verify-secret-answer-by-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          secretAnswer: formValues.secretAnswer,
        }),
      });

      const result: ApiResponse<{ resetToken: string }> = await response.json();

      if (!result.success) {
        setRootError(result.message || "秘密の質問の答えが正しくありません");
        return;
      }

      // パスワードリセットトークンをセッションストレージに保存
      sessionStorage.setItem("passwordResetToken", result.payload.resetToken);
      
      // パスワード更新ページに遷移
      router.push("/update-password");
    } catch (error) {
      setRootError("エラーが発生しました。しばらく時間をおいて再度お試しください。");
    } finally {
      setIsPending(false);
    }
  };

  const handleBackToEmailInput = () => {
    sessionStorage.removeItem("resetEmail");
    router.push("/password-reset");
  };

  if (isLoading) {
    return (
      <main className="max-w-md mx-auto">
        <div className="text-2xl font-bold mb-6">
          <FontAwesomeIcon icon={faQuestion} className="mr-1.5" />
          秘密の質問
        </div>
        <div className="flex items-center justify-center py-8">
          <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
          読み込み中...
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto">
      <div className="text-2xl font-bold mb-6">
        <FontAwesomeIcon icon={faQuestion} className="mr-1.5" />
        秘密の質問
      </div>

      {email && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 mb-2">
            <strong>対象アカウント:</strong> {email}
          </p>
          <p className="text-sm text-blue-600">
            本人確認のため、秘密の質問にお答えください。
          </p>
        </div>
      )}

      {secretQuestion && (
        <form
          noValidate
          onSubmit={formMethods.handleSubmit(onSubmit)}
          className="flex flex-col gap-y-4"
        >
          <div>
            <label className="mb-2 block font-bold">秘密の質問</label>
            <div className="p-3 bg-gray-50 border border-gray-300 rounded-md">
              {secretQuestion.question}
            </div>
          </div>

          <div>
            <label htmlFor="secretAnswer" className="mb-2 block font-bold">
              答え
            </label>
            <TextInputField
              {...formMethods.register("secretAnswer")}
              id="secretAnswer"
              placeholder="秘密の質問への答えを入力してください"
              type="text"
              disabled={isPending}
              error={!!fieldErrors.secretAnswer}
              autoComplete="off"
              onChange={(e) => {
                const value = e.target.value;
                setAnswerValue(value);
                formMethods.setValue("secretAnswer", value);
                clearRootErrorOnChange();
              }}
            />
            <ErrorMsgField msg={fieldErrors.secretAnswer?.message} />
          </div>

          <ErrorMsgField msg={fieldErrors.root?.message} />

          <div className="flex gap-x-4">
            <Button
              type="button"
              variant="indigo"
              width="stretch"
              onClick={handleBackToEmailInput}
              disabled={isPending}
              className="bg-gray-500 hover:bg-gray-600"
            >
              <FontAwesomeIcon icon={faUndo} className="mr-2" />
              戻る
            </Button>
            <Button
              type="submit"
              variant="indigo"
              width="stretch"
              disabled={answerValue.trim().length === 0 || isPending}
            >
              {isPending ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                  確認中...
                </>
              ) : (
                "確認"
              )}
            </Button>
          </div>
        </form>
      )}

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>セキュリティ:</strong><br />
          秘密の質問の答えが正しくない場合、パスワードのリセットはできません。
          答えを忘れた場合は、管理者にお問い合わせください。
        </p>
      </div>
    </main>
  );
};

export default Page;
