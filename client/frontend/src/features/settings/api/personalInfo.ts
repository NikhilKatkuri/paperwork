"use client";
import { useState } from 'react';
import { sensitiveData } from '@/types';
import { endpoints } from '@/api/endpoints';
import { http } from '@/api/http';
import storage_buckets from '@/config';

type HandlerResponse = {
  message: string;
  status: number;
  data?: sensitiveData;
};

type Result =
  | { success: true }
  | { success: false; message: string };

interface CacheData {
  data: sensitiveData;
  storedAt: number;
}

const CACHE_KEY = storage_buckets.personalInfo;
const CACHE_TTL = 5 * 60 * 1000;

function storeToCache(data: Partial<sensitiveData> | sensitiveData) {
  const existing = getFromCache();

  const merged: sensitiveData = existing
    ? ({ ...existing.data, ...data } as sensitiveData)
    : (data as sensitiveData);

  const payload: CacheData = {
    data: merged,
    storedAt: Date.now(),
  };

  localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
}

function getFromCache(): CacheData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CacheData;

    // Validate shape
    if (!parsed?.data || typeof parsed.storedAt !== 'number') {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    // Expire cache
    if (Date.now() - parsed.storedAt > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return parsed;
  } catch {
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
}

export function clearPersonalInfoCache() {
  localStorage.removeItem(CACHE_KEY);
}

export function useUserPersonalInfo() {
  const [saving, setSaving] = useState(false);

  async function update(
    data: Partial<sensitiveData>
  ): Promise<Result> {
    setSaving(true);

    try {
      const { path } = endpoints.auth.sensitiveInfo;

      const res = await http.put<HandlerResponse>(path, data);

      if (res.status === 200) {
        storeToCache(data);
        return { success: true };
      }

      return {
        success: false,
        message: res.data?.message || 'Failed to update personal information.',
      };
    } catch (error) {
      console.error('Error updating personal information:', error);

      return {
        success: false,
        message: 'An error occurred while updating personal information.',
      };
    } finally {
      setSaving(false);
    }
  }

  return {
    saving,
    update,
  };
}

// -------------------- Retrieve Hook --------------------

export function useRetrievePersonalInfo() {
  const [loading, setLoading] = useState(false);
  const [personalInfo, setPersonalInfo] = useState<sensitiveData | null>(null);

  async function retrieve() {
    setLoading(true);

    try {
      // Try cache first
      const cached = getFromCache();

      if (cached) {
        setPersonalInfo(cached.data);
        return;
      }

      // Fetch from API
      const { path } = endpoints.auth.sensitiveInfo;

      const res = await http.get<HandlerResponse>(path);

      if (res.status === 200 && res.data?.data) {
        setPersonalInfo(res.data.data);
        storeToCache(res.data.data);
      } else {
        console.error(
          'Failed to retrieve personal information:',
          res.data?.message
        );
      }
    } catch (error) {
      console.error('Error retrieving personal information:', error);
    } finally {
      setLoading(false);
    }
  }

  return {
    loading,
    personalInfo,
    retrieve,
  };
}

export default useUserPersonalInfo;