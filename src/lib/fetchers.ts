import useSWR, { SWRConfiguration, SWRResponse } from "swr";
import { apiFetch } from "./api";

type Key = [string, string?];

export const swrFetcher = async <T>([endpoint, token]: Key): Promise<T> =>
  apiFetch<T>(endpoint, { token });

export const useAuthorizedSWR = <T>(
  endpoint: string | null,
  token?: string | null,
  config?: SWRConfiguration<T>,
): SWRResponse<T, Error> =>
  useSWR<T, Error>(
    endpoint && token ? [endpoint, token] : null,
    swrFetcher,
    config,
  );

