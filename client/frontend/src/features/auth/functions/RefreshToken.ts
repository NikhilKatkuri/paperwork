"use client";

import { useState, useCallback } from "react";
import api from "@/auth/functions/api";
import axios, { AxiosError } from "axios";
import { RefreshTokenResponse } from "@/auth/types/api.response.types";

type RefreshTokenResult =
  | { ok: true; data: RefreshTokenResponse }
  | { ok: false; error: string };

function useRefreshToken() {
  const [loading, setLoading] = useState<boolean>(false);

  const handleRefreshToken = useCallback(async (): Promise<RefreshTokenResult> => {
    setLoading(true);

    try {
      const { method, url } = api.auth.refreshToken;
      const res = await axios(url, {
        method,
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });

      if (res.status === 200) {
        return { ok: true, data: res.data as RefreshTokenResponse };
      }

      return { ok: false, error: "Unexpected response from server." };
    } catch (e: unknown) {
      let msg = "Session expired. Please sign in again.";

      if (axios.isAxiosError(e)) {
        const err = e as AxiosError<{ message?: string }>;

        if (err.response) {
          const { status, data } = err.response;

          if (status === 401) {
            msg = "Session expired. Please sign in again.";
          } else if (status >= 400 && status < 500 && data?.message) {
            msg = data.message;
          } else if (status >= 500) {
            msg = "Server error. Please try again later.";
          } else {
            msg = "An error occurred. Please try again.";
          }
        } else if (err.request) {
          msg = "Network error. Please check your connection.";
        }
      }

      return { ok: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, handleRefreshToken };
}

export default useRefreshToken;