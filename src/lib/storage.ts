import { AuthResponse, AuthTokens, User } from "@/types";

const STORAGE_KEY =
  process.env.NEXT_PUBLIC_STORAGE_KEY ?? "quizteacherfe_tokens";

interface PersistedAuthState {
  tokens: AuthTokens;
  user: User;
}

export const storage = {
  load(): PersistedAuthState | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as PersistedAuthState) : null;
    } catch {
      return null;
    }
  },
  save(payload: PersistedAuthState) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  },
  clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(STORAGE_KEY);
  },
};

export const persistAuthResponse = (data: AuthResponse) => {
  storage.save({ tokens: data.data.tokens, user: data.data.user });
};

