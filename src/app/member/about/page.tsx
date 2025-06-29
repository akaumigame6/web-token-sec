"use client";

import React, { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faIdCard, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { TextInputField } from "@/app/_components/TextInputField";
import { ErrorMsgField } from "@/app/_components/ErrorMsgField";
import { Button } from "@/app/_components/Button";
import NextLink from "next/link";
import type { ApiResponse } from "@/app/_types/ApiResponse";
import type { About } from "@/app/_types/About";
import { aboutSchema } from "@/app/_types/About";
import { twMerge } from "tailwind-merge";
import { AboutView } from "@/app/_components/AboutView";

const Page: React.FC = () => {
  const c_AboutSlug = "aboutSlug";
  const c_AboutContent = "aboutContent";

  const ep = "/api/about-draft";

  const [isInitialized, setIsInitialized] = useState(false);

  // フォーム処理関連の準備と設定
  const formMethods = useForm<About>({
    mode: "onChange",
    resolver: zodResolver(aboutSchema),
  });
  const fieldErrors = formMethods.formState.errors;

  const watchedSlug = useWatch({
    control: formMethods.control,
    name: c_AboutSlug,
  });

  // ルートエラー（サーバサイドで発生した認証エラー）の表示設定の関数
  const setRootError = (errorMsg: string) => {
    formMethods.setError("root", {
      type: "manual",
      message: errorMsg,
    });
  };

  // ルートエラーメッセージのクリアに関する設定
  useEffect(() => {
    const subscription = formMethods.watch((_, { name }) => {
      if (name === c_AboutSlug) {
        formMethods.clearErrors("root");
      }
    });
    return () => subscription.unsubscribe();
  }, [formMethods]);

  const publicState =
    watchedSlug && !fieldErrors.aboutSlug?.message
      ? `/about/${watchedSlug} で公開されます。`
      : "公開されません（有効なパスが未設定です）";

  useEffect(() => {
    if (isInitialized) return;
    const fetchAbout = async () => {
      const jwt = localStorage.getItem("jwt");
      const headers: HeadersInit = {};
      if (jwt) headers["Authorization"] = `Bearer ${jwt}`;
      const res = await fetch(ep, {
        credentials: "same-origin",
        cache: "no-store",
        headers,
      });
      const data: ApiResponse<About> = await res.json();
      console.log("About ページの情報取得結果:", data);
      if (data.success) {
        const parsedData = aboutSchema.parse(data.payload);
        formMethods.reset(parsedData);
      } else {
        console.error("About ページの情報取得に失敗しました。", data.message);
      }
      setIsInitialized(true);
    };
    fetchAbout();
  }, [formMethods, isInitialized]);

  // フォームの送信処理
  const onSubmit = async (formValues: About) => {
    const jwt = localStorage.getItem("jwt");
    const headers: HeadersInit = {};
    if (jwt) headers["Authorization"] = `Bearer ${jwt}`;

    const res = await fetch(ep, {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers,
      body: JSON.stringify(formValues),
    });

    const body: ApiResponse<About> = await res.json();

    if (!body.success) {
      setRootError(body.message);
      return;
    }

    formMethods.reset(body.payload);
  };

  if (!isInitialized) {
    return (
      <main>
        <div className="text-2xl font-bold">
          <FontAwesomeIcon icon={faIdCard} className="mr-1.5" />
          Local Tech News
        </div>
        <div className="mt-4 flex items-center gap-x-2">
          <FontAwesomeIcon
            icon={faSpinner}
            className="animate-spin text-gray-500"
          />
          <div>Loading... </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="text-2xl font-bold">
        <FontAwesomeIcon icon={faIdCard} className="mr-1.5" />
        About（編集）
      </div>

      {/* ナビゲーションメニュー */}
      <div className="mt-4 mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="font-bold text-gray-700 mb-3">アカウント設定</h3>
        <div className="flex flex-wrap gap-2">
          <NextLink
            href="/secretQuestion"
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          >
            パスワード変更
          </NextLink>
          <NextLink
            href="/member/update-secret-question"
            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
          >
            秘密の質問変更
          </NextLink>
        </div>
      </div>

      <form
        noValidate
        onSubmit={formMethods.handleSubmit(onSubmit)}
        className="mt-4 mb-4 flex flex-col gap-y-2"
      >
        <div>
          <label htmlFor={c_AboutSlug} className="mb-1 block">
            <div className="flex items-center gap-x-2">
              <div className="font-bold">公開URL</div>
              <div className="text-sm text-gray-500">{publicState}</div>
            </div>
          </label>
          <TextInputField
            {...formMethods.register(c_AboutSlug)}
            id={c_AboutSlug}
            placeholder="4〜16文字の英小文字・数字・ハイフンが使用できます。"
            type="email"
            disabled={formMethods.formState.isSubmitting}
            error={!!fieldErrors.aboutSlug}
            autoComplete="off"
          />

          <ErrorMsgField msg={fieldErrors.aboutSlug?.message} />
          <ErrorMsgField msg={fieldErrors.root?.message} />
        </div>

        <div>
          <label htmlFor={c_AboutContent} className="mb-1 block font-bold">
            コンテンツ
          </label>
          <textarea
            {...formMethods.register(c_AboutContent)}
            id="content"
            className={twMerge(
              "w-full rounded-md border border-gray-300 px-3 py-2",
              "focus:ring-2 focus:ring-slate-700 focus:outline-none",
            )}
            rows={6}
            placeholder="本文を入力してください。"
            disabled={formMethods.formState.isSubmitting}
          />
          <ErrorMsgField msg={fieldErrors.aboutContent?.message} />
        </div>

        <Button
          variant="indigo"
          width="stretch"
          className={twMerge("tracking-widest")}
          isBusy={formMethods.formState.isSubmitting}
          disabled={
            !formMethods.formState.isValid || formMethods.formState.isSubmitting
          }
        >
          更新
        </Button>
      </form>

      <div className="my-4 flex flex-col gap-y-1">
        <div className="text-lg font-bold text-indigo-400">Preview</div>
        <div className="rounded-md bg-indigo-50 p-4">
          <AboutView about={formMethods.getValues()} />
        </div>
      </div>
    </main>
  );
};

export default Page;
