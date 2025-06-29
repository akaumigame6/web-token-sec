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
import { faKey, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { ApiResponse } from "@/app/_types/ApiResponse";
import type { SecretQuestion } from "@/app/_types/SecretQuestion";

// 秘密の質問回答フォームのスキーマ
const secretAnswerSchema = z.object({
  answer: z.string().min(1, "答えを入力してください"),
});

type SecretAnswerForm = z.infer<typeof secretAnswerSchema>;

const Page: React.FC = () => {
  const { userProfile } = useAuth();
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [userSecretQuestion, setUserSecretQuestion] = useState<SecretQuestion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false); // API呼び出し済みフラグ
  const [answerValue, setAnswerValue] = useState(""); // 答えの値を独自で管理

  // フォーム処理関連の準備と設定
  const formMethods = useForm<SecretAnswerForm>({
    mode: "onChange",
    resolver: zodResolver(secretAnswerSchema),
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

  // ログインしていない場合はログインページにリダイレクト
  useEffect(() => {
    if (!userProfile) {
      router.replace("/login");
      return;
    }
  }, [userProfile, router]);

  // ユーザーの秘密の質問を取得
  useEffect(() => {
    if (!userProfile || hasLoaded) return; // 既に読み込み済みの場合はスキップ

    const fetchUserSecretQuestion = async () => {
      try {
        const res = await fetch("/api/user-secret-question", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("jwt")}`,
          },
        });

        const data: ApiResponse<SecretQuestion> = await res.json();
        if (data.success) {
          setUserSecretQuestion(data.payload);
        } else {
          formMethods.setError("root", {
            type: "manual",
            message: data.message,
          });
        }
      } catch (error) {
        formMethods.setError("root", {
          type: "manual",
          message: "秘密の質問の取得に失敗しました。",
        });
      } finally {
        setIsLoading(false);
        setHasLoaded(true); // 読み込み完了フラグを設定
      }
    };

    fetchUserSecretQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile, hasLoaded]); // hasLoadedを依存配列に追加

  // フォームの送信処理
  const onSubmit = async (formValues: SecretAnswerForm) => {
    try {
      setIsPending(true);
      formMethods.clearErrors("root");

      const res = await fetch("/api/verify-secret-answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
        body: JSON.stringify({ answer: formValues.answer }),
      });

      const data: ApiResponse<{ resetToken: string }> = await res.json();
      
      if (data.success && data.payload) {
        // 時間制限付きトークンをセッションストレージに保存（セキュリティのため）
        sessionStorage.setItem("passwordResetToken", data.payload.resetToken);
        
        // パスワード更新ページに遷移
        router.push("/update-password");
      } else {
        setRootError(data.message || "答えが正しくありません。");
      }
    } catch (error) {
      setRootError("サーバーエラーが発生しました。しばらく時間をおいて再度お試しください。");
    } finally {
      setIsPending(false);
    }
  };

  // ローディング中の表示
  if (isLoading) {
    return (
      <main className="flex items-center justify-center min-h-[50vh]">
        <div className="flex items-center gap-x-2">
          <FontAwesomeIcon icon={faSpinner} spin />
          <div>秘密の質問を読み込み中...</div>
        </div>
      </main>
    );
  }

  // ログインしていない場合の表示
  if (!userProfile) {
    return null;
  }

  return (
    <main className="max-w-md mx-auto">
      <div className="text-2xl font-bold mb-6">
        <FontAwesomeIcon icon={faKey} className="mr-1.5" />
        本人確認
      </div>

      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800 mb-2">
          パスワードを変更するために、本人確認を行います。
        </p>
        <p className="text-sm text-blue-600">
          アカウント登録時に設定した秘密の質問にお答えください。
        </p>
      </div>

      {userSecretQuestion && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="font-bold text-gray-700 mb-2">秘密の質問:</h3>
          <p className="text-gray-800">{userSecretQuestion.question}</p>
        </div>
      )}

      <form
        noValidate
        onSubmit={formMethods.handleSubmit(onSubmit)}
        className="flex flex-col gap-y-4"
      >
        <div>
          <label htmlFor="answer" className="mb-2 block font-bold">
            答え
          </label>
          <TextInputField
            {...formMethods.register("answer")}
            id="answer"
            placeholder="答えを入力してください"
            type="text"
            disabled={isPending}
            error={!!fieldErrors.answer}
            autoComplete="off"
            onChange={(e) => {
              const value = e.target.value;
              setAnswerValue(value);
              formMethods.setValue("answer", value);
              clearRootErrorOnChange();
            }}
          />
          <ErrorMsgField msg={fieldErrors.answer?.message} />
        </div>

        <ErrorMsgField msg={fieldErrors.root?.message} />

        <div className="flex gap-x-4">
          <Button
            type="button"
            variant="indigo"
            width="stretch"
            onClick={() => router.back()}
            disabled={isPending}
            className="bg-gray-500 hover:bg-gray-600"
          >
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
              "答えを確認"
            )}
          </Button>
        </div>
      </form>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>セキュリティに関する注意:</strong><br />
          この認証は一時的なものです。パスワード変更後は再度ログインが必要になります。
        </p>
      </div>
    </main>
  );
};

export default Page;
