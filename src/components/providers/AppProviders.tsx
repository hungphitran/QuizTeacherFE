'use client';

import { SWRConfig } from "swr";
import type { ReactNode } from "react";
import { AuthProvider } from "./AuthProvider";
import { swrFetcher } from "@/lib/fetchers";

export const AppProviders = ({ children }: { children: ReactNode }) => (
  <SWRConfig
    value={{
      fetcher: swrFetcher,
      dedupingInterval: 1000,
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }}
  >
    <AuthProvider>{children}</AuthProvider>
  </SWRConfig>
);

