"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TextInputField } from "@/app/_components/TextInputField";
import { ErrorMsgField } from "@/app/_components/ErrorMsgField";
import { Button } from "@/app/_components/Button";
import { useRouter } from "next/navigation";
import { faKey, faSpinner, faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { ApiResponse } from "@/app/_types/ApiResponse";

// メールアドレス入力フォームのスキーマ
const emailSchema = z.object({
  email: z.string().email("正しいメールアドレスを入力してください"),
});

type EmailForm = z.infer<typeof emailSchema>;

const Page: React.FC = () => {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [emailValue, setEmailValue] = useState("");

  // フォーム処理関連の準備と設定
  const formMethods = useForm<EmailForm>({
    mode: "onChange",
    resolver: zodResolver(emailSchema),
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

  // フォームの送信処理
  const onSubmit = async (formValues: EmailForm) => {
    try {
      setIsPending(true);
      formMethods.clearErrors("root");

      // メールアドレスをセッションストレージに保存して次のページで使用
      sessionStorage.setItem("resetEmail", formValues.email);
      
      // 秘密の質問ページに遷移
      router.push("/secret-question-reset");
    } catch (error) {
      setRootError("エラーが発生しました。しばらく時間をおいて再度お試しください。");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <main className="max-w-md mx-auto">
      <div className="text-2xl font-bold mb-6">
        <FontAwesomeIcon icon={faKey} className="mr-1.5" />
        パスワードリセット
      </div>

      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800 mb-2">
          パスワードをリセットするアカウントのメールアドレスを入力してください。
        </p>
        <p className="text-sm text-blue-600">
          次のページで秘密の質問による本人確認を行います。
        </p>
      </div>

      <form
        noValidate
        onSubmit={formMethods.handleSubmit(onSubmit)}
        className="flex flex-col gap-y-4"
      >
        <div>
          <label htmlFor="email" className="mb-2 block font-bold">
            <FontAwesomeIcon icon={faEnvelope} className="mr-1" />
            メールアドレス
          </label>
          <TextInputField
            {...formMethods.register("email")}
            id="email"
            placeholder="your-email@example.com"
            type="email"
            disabled={isPending}
            error={!!fieldErrors.email}
            autoComplete="email"
            onChange={(e) => {
              const value = e.target.value;
              setEmailValue(value);
              formMethods.setValue("email", value);
              clearRootErrorOnChange();
            }}
          />
          <ErrorMsgField msg={fieldErrors.email?.message} />
        </div>

        <ErrorMsgField msg={fieldErrors.root?.message} />

        <div className="flex gap-x-4">
          <Button
            type="button"
            variant="indigo"
            width="stretch"
            onClick={() => router.push("/login")}
            disabled={isPending}
            className="bg-gray-500 hover:bg-gray-600"
          >
            ログインに戻る
          </Button>
          <Button
            type="submit"
            variant="indigo"
            width="stretch"
            disabled={emailValue.trim().length === 0 || isPending}
          >
            {isPending ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                処理中...
              </>
            ) : (
              "次へ"
            )}
          </Button>
        </div>
      </form>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>注意:</strong><br />
          入力したメールアドレスでアカウントが見つからない場合、次のページでエラーが表示されます。
        </p>
      </div>
    </main>
  );
};

export default Page;
