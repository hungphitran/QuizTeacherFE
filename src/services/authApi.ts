import { apiFetch } from "@/lib/api";
import { AuthResponse } from "@/types";

interface LoginPayload extends Record<string, unknown> {
  email: string;
  password: string;
}

interface RegisterPayload extends LoginPayload {
  fullName: string;
  role?: string;
}

export const authApi = {
  login: (payload: LoginPayload) =>
    apiFetch<AuthResponse>("/users/login", {
      method: "POST",
      body: payload,
    }),
  register: (payload: RegisterPayload) =>
    apiFetch<AuthResponse>("/users/register", {
      method: "POST",
      body: payload,
    }),
};

