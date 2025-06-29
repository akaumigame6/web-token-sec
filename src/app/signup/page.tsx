"use client";

// ServerAction (Custom Invocation) を利用した実装
// （ /api/signup のようなAPIエンドポイントを実装する必要がない ）

import React, { useState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupRequestSchema, SignupRequest } from "@/app/_types/SignupRequest";
import { TextInputField } from "@/app/_components/TextInputField";
import { ErrorMsgField } from "@/app/_components/ErrorMsgField";
import { Button } from "@/app/_components/Button";
import { SecretQuestion } from "@/app/_types/SecretQuestion";
import type { ApiResponse } from "@/app/_types/ApiResponse";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { faSpinner, faPenNib } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { signupServerAction } from "@/app/_actions/signup";

import zxcvbn from "zxcvbn";

const Page: React.FC = () => {
  const c_Name = "name";
  const c_Email = "email";
  const c_Password = "password";
  const c_ConfirmPassword = "confirmPassword";
  const c_SecretQuestionId = "secretQuestionId";
  const c_SecretAnswer = "secretAnswer";

  const router = useRouter();

  const [isPending, startTransition] = useTransition();
  const [isSignUpCompleted, setIsSignUpCompleted] = useState(false);

  // パスワードの強度の状態
  const [passwordStrength, setPasswordStrength] = useState<string | null>(null);
  const [questions, setQuestions] = useState<SecretQuestion[] | null >(null);


  // フォーム処理関連の準備と設定
  const formMethods = useForm<SignupRequest>({
    mode: "onChange",
    resolver: zodResolver(signupRequestSchema),
  });
  const fieldErrors = formMethods.formState.errors;

  useEffect(() => {
    // APIから質問リストを取得
    fetch("/api/secret-questions")
      .then((res) => res.json())
      .then((data: ApiResponse<SecretQuestion[]>) => {
        if (data.success) {
          setQuestions(data.payload);
        } else {
          console.error("秘密の質問の取得に失敗しました:", data.message);
        }
      })
      .catch((error) => {
        console.error("秘密の質問の取得でエラーが発生しました:", error);
      });
  }, []);

  // ルートエラー（サーバサイドで発生した認証エラー）の表示設定の関数
  const setRootError = (errorMsg: string) => {
    formMethods.setError("root", {
      type: "manual",
      message: errorMsg,
    });
  };

  // ルートエラーメッセージのクリアに関する設定
  useEffect(() => {
    const subscription = formMethods.watch((value, { name }) => {
      if (name === c_Email || name === c_Password) {
        formMethods.clearErrors("root");
      }
    });
    return () => subscription.unsubscribe();
  }, [formMethods]);

  // ログイン完了後のリダイレクト処理
  useEffect(() => {
    if (isSignUpCompleted) {
      router.replace(`/login?${c_Email}=${formMethods.getValues(c_Email)}`);
      router.refresh();
      console.log("サインアップ完了");
    }
  }, [formMethods, isSignUpCompleted, router]);

  // パスワード入力に応じて強度を評価する
  useEffect(() => {
    const subscription = formMethods.watch((value, { name }) => {
      if (name === c_Password) {
        const pwd = value.password ?? "";
        const result = zxcvbn(pwd); // パスワード強度を評価
        const label = ["とても弱い", "弱い", "普通", "強い", "とても強い"][result.score];
        setPasswordStrength(label); // スコア（0〜4）に応じた強度ラベルを設定
      }
    });
    return () => subscription.unsubscribe();
  }, [formMethods]);

  // フォームの送信処理
  const onSubmit = async (signupRequest: SignupRequest) => {
    try {
      startTransition(async () => {
        // ServerAction (Custom Invocation) の利用
        const res = await signupServerAction(signupRequest);
        if (!res.success) {
          setRootError(res.message);
          return;
        }
        setIsSignUpCompleted(true);
      });
    } catch (e) {
      const errorMsg =
        e instanceof Error ? e.message : "予期せぬエラーが発生しました。";
      setRootError(errorMsg);
    }
  };

  return (
    <main>
      <div className="text-2xl font-bold">
        <FontAwesomeIcon icon={faPenNib} className="mr-1.5" />
        Signup
      </div>
      <form
        noValidate
        onSubmit={formMethods.handleSubmit(onSubmit)}
        className="mt-4 flex flex-col gap-y-4"
      >
        <div>
          <label htmlFor={c_Name} className="mb-2 block font-bold">
            表示名
          </label>
          <TextInputField
            {...formMethods.register(c_Name)}
            id={c_Name}
            placeholder="寝屋川 タヌキ"
            type="text"
            disabled={isPending || isSignUpCompleted}
            error={!!fieldErrors.name}
            autoComplete="name"
          />
          <ErrorMsgField msg={fieldErrors.name?.message} />
        </div>

        <div>
          <label htmlFor={c_Email} className="mb-2 block font-bold">
            メールアドレス（ログインID）
          </label>
          <TextInputField
            {...formMethods.register(c_Email)}
            id={c_Email}
            placeholder="name@example.com"
            type="email"
            disabled={isPending || isSignUpCompleted}
            error={!!fieldErrors.email}
            autoComplete="email"
          />
          <ErrorMsgField msg={fieldErrors.email?.message} />
        </div>

        <div>
          <label htmlFor={c_Password} className="mb-2 block font-bold">
            パスワード
          </label>
          <TextInputField
            {...formMethods.register(c_Password)}
            id={c_Password}
            placeholder="*****"
            type="password"
            disabled={isPending || isSignUpCompleted}
            error={!!fieldErrors.password}
            autoComplete="off"
          />
          <ErrorMsgField msg={fieldErrors.password?.message} />
          <ErrorMsgField msg={fieldErrors.root?.message} />
          {/* パスワード強度の表示（色付きでレベル表示） */}
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
        <label htmlFor={c_ConfirmPassword} className="mb-2 block font-bold">
          確認用パスワード
        </label>
        <TextInputField
          {...formMethods.register(c_ConfirmPassword)}
          id={c_ConfirmPassword}
          placeholder="もう一度入力してください"
          type="password"
          disabled={isPending || isSignUpCompleted}
          error={!!fieldErrors.confirmPassword}
          autoComplete="off"
        />
        <ErrorMsgField msg={fieldErrors.confirmPassword?.message} />
      </div>

      {/* 秘密の質問選択欄 */}
      <div>
        <label htmlFor={c_SecretQuestionId} className="mb-2 block font-bold">
          秘密の質問
        </label>
        <select
          {...formMethods.register(c_SecretQuestionId, { valueAsNumber: true })}
          id={c_SecretQuestionId}
          className="w-full rounded border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          disabled={isPending || isSignUpCompleted || !questions}
        >
          <option value="">質問を選択してください</option>
          {questions?.map((q) => (
            <option key={q.id} value={q.id}>
              {q.question}
            </option>
          ))}
        </select>
        <ErrorMsgField msg={fieldErrors.secretQuestionId?.message} />
      </div>

      {/* 答えの入力欄 */}
      <div>
        <label htmlFor={c_SecretAnswer} className="mb-2 block font-bold">
          質問の答え
        </label>
        <TextInputField
          {...formMethods.register(c_SecretAnswer)}
          id={c_SecretAnswer}
          placeholder="質問の答えを入力してください"
          type="text"
          disabled={isPending || isSignUpCompleted}
          error={!!fieldErrors.secretAnswer}
          autoComplete="off"
        />
        <ErrorMsgField msg={fieldErrors.secretAnswer?.message} />
      </div>

        <Button
          variant="indigo"
          width="stretch"
          className="tracking-widest"
          disabled={
            !formMethods.formState.isValid ||
            formMethods.formState.isSubmitting ||
            isSignUpCompleted
          }
        >
          登録
        </Button>
      </form>

      {isSignUpCompleted && (
        <div>
          <div className="mt-4 flex items-center gap-x-2">
            <FontAwesomeIcon icon={faSpinner} spin />
            <div>サインアップが完了しました。ログインページに移動します。</div>
          </div>
          <NextLink
            href={`/login?${c_Email}=${formMethods.getValues(c_Email)}`}
            className="text-blue-500 hover:underline"
          >
            自動的に画面が切り替わらないときはこちらをクリックしてください。
          </NextLink>
        </div>
      )}
    </main>
  );
};

export default Page;
