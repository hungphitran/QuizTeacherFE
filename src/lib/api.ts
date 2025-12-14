import { ApiErrorPayload } from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";

export class ApiError extends Error {
  status?: number;
  payload?: ApiErrorPayload;

  constructor(message: string, status?: number, payload?: ApiErrorPayload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

interface RequestOptions extends Omit<RequestInit, "method" | "body"> {
  method?: HttpMethod;
  body?: Record<string, unknown> | FormData;
  token?: string;
}

const getDefaultHeaders = (token?: string) => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

export async function apiFetch<TResponse>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<TResponse> {
  const { method = "GET", body, token, headers, ...rest } = options;

  const finalHeaders =
    body instanceof FormData
      ? { ...(token && { Authorization: `Bearer ${token}` }), ...headers }
      : { ...getDefaultHeaders(token), ...headers };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: finalHeaders,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    ...rest,
  });

  const contentType = response.headers.get("content-type");
  const payload = contentType?.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const errorPayload =
      typeof payload === "string" ? { message: payload } : payload;
    
    // Log chi tiết lỗi để debug
    console.error("API Error:", {
      endpoint,
      status: response.status,
      payload: errorPayload,
      method,
    });
    
    throw new ApiError(
      errorPayload?.message ?? "Unexpected API error",
      response.status,
      errorPayload,
    );
  }

  // Extract data from wrapper if API returns { data: ..., message, status }
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data as TResponse;
  }

  return payload as TResponse;
}

