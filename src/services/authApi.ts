import { apiFetch } from "@/lib/api";
import { AuthResponse } from "@/types";

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload extends LoginPayload {
  fullName: string;
  role: "USER" | "ADMIN" | "TEACHER";
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

