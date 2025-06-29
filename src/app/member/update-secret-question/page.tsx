"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TextInputField } from "@/app/_components/TextInputField";
import { ErrorMsgField } from "@/app/_components/ErrorMsgField";
import { Button } from "@/app/_components/Button";
import { useAuth } from "@/app/_hooks/useAuth";
import { useRouter } from "next/navigation";
import { faShield, faSpinner, faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { ApiResponse } from "@/app/_types/ApiResponse";
import type { SecretQuestion } from "@/app/_types/SecretQuestion";

// 秘密の質問更新フォームのスキーマ
const updateSecretQuestionSchema = z.object({
  secretQuestionId: z.number().min(1, "秘密の質問を選択してください"),
  secretAnswer: z.string().min(1, "秘密の質問の答えを入力してください"),
  currentPassword: z.string().min(1, "現在のパスワードを入力してください"),
});

type UpdateSecretQuestionForm = z.infer<typeof updateSecretQuestionSchema>;

const Page: React.FC = () => {
  const { userProfile } = useAuth();
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [secretQuestions, setSecretQuestions] = useState<SecretQuestion[]>([]);
  const [currentSecretQuestion, setCurrentSecretQuestion] = useState<SecretQuestion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [secretAnswerValue, setSecretAnswerValue] = useState("");
  const [currentPasswordValue, setCurrentPasswordValue] = useState("");

  // フォーム処理関連の準備と設定
  const formMethods = useForm<UpdateSecretQuestionForm>({
    mode: "onChange",
    resolver: zodResolver(updateSecretQuestionSchema),
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

  // ログインしていない場合はログインページにリダイレクト
  useEffect(() => {
    if (!userProfile) {
      router.replace("/login");
      return;
    }
  }, [userProfile, router]);

  // 秘密の質問一覧と現在の設定を取得
  useEffect(() => {
    if (!userProfile) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // 秘密の質問一覧を取得
        const secretQuestionsRes = await fetch("/api/secret-questions", {
          headers: {
            "Content-Type": "application/json",
          },
        });
        const secretQuestionsData: ApiResponse<SecretQuestion[]> = await secretQuestionsRes.json();
        
        // 現在の秘密の質問を取得
        const currentRes = await fetch("/api/user-secret-question", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("jwt")}`,
          },
        });
        const currentData: ApiResponse<SecretQuestion> = await currentRes.json();

        if (secretQuestionsData.success) {
          setSecretQuestions(secretQuestionsData.payload);
        }
        
        if (currentData.success) {
          setCurrentSecretQuestion(currentData.payload);
          // 現在の質問をデフォルト選択
          formMethods.setValue("secretQuestionId", currentData.payload.id);
        }
      } catch (error) {
        setRootError("データの取得に失敗しました。");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userProfile, formMethods, setRootError]);

  // 更新完了後のリダイレクト処理
  useEffect(() => {
    if (isCompleted) {
      const timer = setTimeout(() => {
        router.push("/member/about");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isCompleted, router]);

  // フォームの送信処理
  const onSubmit = async (formValues: UpdateSecretQuestionForm) => {
    try {
      setIsPending(true);
      formMethods.clearErrors("root");

      const res = await fetch("/api/update-secret-question", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
        body: JSON.stringify(formValues),
      });

      const data: ApiResponse<null> = await res.json();
      
      if (data.success) {
        setIsCompleted(true);
      } else {
        setRootError(data.message || "秘密の質問の更新に失敗しました。");
      }
    } catch (error) {
      setRootError("サーバーエラーが発生しました。しばらく時間をおいて再度お試しください。");
    } finally {
      setIsPending(false);
    }
  };

  // ログインしていない場合の表示
  if (!userProfile) {
    return null;
  }

  // ローディング中の表示
  if (isLoading) {
    return (
      <main className="flex items-center justify-center min-h-[50vh]">
        <div className="flex items-center gap-x-2">
          <FontAwesomeIcon icon={faSpinner} spin />
          <div>読み込み中...</div>
        </div>
      </main>
    );
  }

  // 更新完了後の表示
  if (isCompleted) {
    return (
      <main className="max-w-md mx-auto text-center">
        <div className="text-2xl font-bold mb-6 text-green-600">
          <FontAwesomeIcon icon={faCheckCircle} className="mr-1.5" />
          更新完了
        </div>

        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800 mb-2">
            秘密の質問が正常に更新されました。
          </p>
          <p className="text-sm text-green-600">
            新しい設定は即座に有効になります。
          </p>
        </div>

        <div className="flex items-center justify-center gap-x-2 text-gray-600">
          <FontAwesomeIcon icon={faSpinner} spin />
          <span>3秒後にプロフィールページに移動します...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto">
      <div className="text-2xl font-bold mb-6">
        <FontAwesomeIcon icon={faShield} className="mr-1.5" />
        秘密の質問の更新
      </div>

      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800 mb-2">
          パスワードリセット時に使用する秘密の質問を変更できます。
        </p>
        <p className="text-sm text-blue-600">
          セキュリティ確認のため、現在のパスワードが必要です。
        </p>
      </div>

      {currentSecretQuestion && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="font-bold text-gray-700 mb-2">現在の秘密の質問:</h3>
          <p className="text-gray-800">{currentSecretQuestion.question}</p>
        </div>
      )}

      <form
        noValidate
        onSubmit={formMethods.handleSubmit(onSubmit)}
        className="flex flex-col gap-y-4"
      >
        <div>
          <label htmlFor="secretQuestionId" className="mb-2 block font-bold">
            新しい秘密の質問
          </label>
          <select
            {...formMethods.register("secretQuestionId", { valueAsNumber: true })}
            id="secretQuestionId"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isPending}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              formMethods.setValue("secretQuestionId", value);
              clearRootErrorOnChange();
            }}
          >
            <option value="">質問を選択してください</option>
            {secretQuestions.map((question) => (
              <option key={question.id} value={question.id}>
                {question.question}
              </option>
            ))}
          </select>
          <ErrorMsgField msg={fieldErrors.secretQuestionId?.message} />
        </div>

        <div>
          <label htmlFor="secretAnswer" className="mb-2 block font-bold">
            新しい答え
          </label>
          <TextInputField
            {...formMethods.register("secretAnswer")}
            id="secretAnswer"
            placeholder="新しい答えを入力してください"
            type="text"
            disabled={isPending}
            error={!!fieldErrors.secretAnswer}
            autoComplete="off"
            onChange={(e) => {
              const value = e.target.value;
              setSecretAnswerValue(value);
              formMethods.setValue("secretAnswer", value);
              clearRootErrorOnChange();
            }}
          />
          <ErrorMsgField msg={fieldErrors.secretAnswer?.message} />
        </div>

        <div>
          <label htmlFor="currentPassword" className="mb-2 block font-bold">
            現在のパスワード（確認用）
          </label>
          <TextInputField
            {...formMethods.register("currentPassword")}
            id="currentPassword"
            placeholder="現在のパスワードを入力してください"
            type="password"
            disabled={isPending}
            error={!!fieldErrors.currentPassword}
            autoComplete="current-password"
            onChange={(e) => {
              const value = e.target.value;
              setCurrentPasswordValue(value);
              formMethods.setValue("currentPassword", value);
              clearRootErrorOnChange();
            }}
          />
          <ErrorMsgField msg={fieldErrors.currentPassword?.message} />
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
            disabled={
              !formMethods.watch("secretQuestionId") ||
              secretAnswerValue.trim().length === 0 ||
              currentPasswordValue.trim().length === 0 ||
              isPending
            }
          >
            {isPending ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                更新中...
              </>
            ) : (
              "秘密の質問を更新"
            )}
          </Button>
        </div>
      </form>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>セキュリティに関する注意:</strong><br />
          秘密の質問の答えは他人に推測されにくいものを設定してください。<br />
          また、この答えは暗号化されて保存されるため、忘れないよう注意してください。
        </p>
      </div>
    </main>
  );
};

export default Page;
