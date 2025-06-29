"use client";

import React, { useState, useEffect, createContext } from "react";
import type { UserProfile } from "@/app/_types/UserProfile";
import useSWR, { mutate } from "swr";
import type { ApiResponse } from "../_types/ApiResponse";
import { jwtFetcher } from "./jwtFetcher";

interface AuthContextProps {
  userProfile: UserProfile | null;
  logout: () => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextProps | undefined>(
  undefined,
);

interface Props {
  children: React.ReactNode;
}

const AuthProvider: React.FC<Props> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { data: session } = useSWR<ApiResponse<UserProfile | null>>(
    "/api/auth",
    jwtFetcher,
  );

  useEffect(() => {
    if (session && session.success) {
      setUserProfile(session.payload);
      return;
    }
    setUserProfile(null);
  }, [session]);

  const logout = async () => {
    try {
      // ■■ トークンベース認証 ■■
      // サーバーサイドでのトークン無効化処理（必要に応じて）
      await fetch("/api/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
      });
    } catch (error) {
      console.warn("Logout API call failed:", error);
      // ネットワークエラーでもローカルの処理は続行
    } finally {
      // ローカルストレージから JWT を削除
      localStorage.removeItem("jwt");
      // SWR キャッシュを無効化
      mutate(() => true, undefined, { revalidate: false });
      setUserProfile(null);
    }
    return true;
  };

  return (
    <AuthContext.Provider value={{ userProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
