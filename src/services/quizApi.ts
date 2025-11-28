import { apiFetch } from "@/lib/api";
import { Quiz, QuizAttempt, QuizPayload, QuizQuestion, StudentAnswer } from "@/types";
import { ensureArrayResponse } from "@/lib/normalizers";

type PaginationParams = {
  page?: number;
  limit?: number;
  keyword?: string;
};

const buildQueryString = (params?: Record<string, string | number | undefined | null>) => {
  if (!params) {
    return "";
  }

  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query.set(key, String(value));
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
};

export const quizApi = {
  getAll: async (params?: PaginationParams, token?: string) => {
    const query = buildQueryString(params);
    const payload = await apiFetch<Quiz[] | { data?: Quiz[] }>(`/quizzes${query}`, {
      token,
      method: "GET",
    });
    return ensureArrayResponse<Quiz>(payload);
  },
  getById: (id: string, token?: string) =>
    apiFetch<Quiz>(`/quizzes/${id}`, { token, method: "GET" }),
  create: (payload: QuizPayload, token: string) =>
    apiFetch<Quiz>("/quizzes", { method: "POST", body: payload, token }),
  update: (id: string, payload: Partial<QuizPayload>, token: string) =>
    apiFetch<Quiz>(`/quizzes/${id}`, { method: "PATCH", body: payload, token }),
  remove: (id: string, token: string) =>
    apiFetch<void>(`/quizzes/${id}`, { method: "DELETE", token }),
  getAttemptsByQuiz: (quizId: string, params: PaginationParams = {}, token?: string) => {
    const query = buildQueryString(params);
    return apiFetch<QuizAttempt[]>(`/quiz_attempts_by_quiz_id/${quizId}${query}`, {
      method: "GET",
      token,
    });
  },
  getAttemptsByStudent: (studentId: string, params: PaginationParams = {}, token?: string) => {
    const query = buildQueryString(params);
    return apiFetch<QuizAttempt[]>(`/quiz_attempts_by_student_id/${studentId}${query}`, {
      method: "GET",
      token,
    });
  },
  getAttemptById: (attemptId: string, token?: string) =>
    apiFetch<QuizAttempt>(`/quiz_attempts/${attemptId}`, {
      method: "GET",
      token,
    }),
  startAttempt: (
    payload: { 
      quizId: number; 
      studentId?: number;
      studentName: string;
      dateOfBirth?: string;
      score: number;
      className?: string;
    },
    token?: string,
  ) =>
    apiFetch<QuizAttempt>("/quiz_attempts", {
      method: "POST",
      body: payload,
      token,
    }),
  submitAnswer: (
    payload: {
      attemptId: number;
      questionId: number;
      selectedOptionId: number;
    },
    token?: string,
  ) =>
    apiFetch<StudentAnswer>("/submit_answer", {
      method: "POST",
      body: payload,
      token,
    }),
  getAnswersByAttempt: (attemptId: string, params: PaginationParams = {}, token?: string) => {
    const query = buildQueryString(params);
    return apiFetch<StudentAnswer[]>(`/student_answers/${attemptId}${query}`, {
      method: "GET",
      token,
    });
  },
  getAttemptsByStudentAndQuiz: (studentId: string, quizId: string, params: PaginationParams = {}, token?: string) => {
    const query = buildQueryString(params);
    return apiFetch<QuizAttempt[]>(
      `/quiz_attempts_by_student_id_and_quiz_id/${studentId}/${quizId}${query}`,
      {
        method: "GET",
        token,
      },
    );
  },
  // Question management
  getQuestions: async (quizId: string, params?: PaginationParams, token?: string) => {
    const query = buildQueryString(params);
    const payload = await apiFetch<QuizQuestion[] | { data?: QuizQuestion[] }>(
      `/quiz/${quizId}/questions${query}`,
      {
        method: "GET",
        token,
      },
    );
    return ensureArrayResponse<QuizQuestion>(payload);
  },
  getQuestionById: (quizId: string, questionId: string, token: string) =>
    apiFetch<QuizQuestion>(`/quiz/${quizId}/questions/${questionId}`, {
      method: "GET",
      token,
    }),
  createQuestion: (quizId: string, payload: Omit<QuizQuestion, "id">, token: string) =>
    apiFetch<QuizQuestion>(`/quiz/${quizId}/questions`, {
      method: "POST",
      body: payload,
      token,
    }),
  updateQuestion: (quizId: string, questionId: string, payload: Partial<Omit<QuizQuestion, "id">>, token: string) =>
    apiFetch<QuizQuestion>(`/quiz/${quizId}/questions/${questionId}`, {
      method: "PATCH",
      body: payload,
      token,
    }),
  deleteQuestion: (quizId: string, questionId: string, token: string) =>
    apiFetch<void>(`/quiz/${quizId}/questions/${questionId}`, {
      method: "DELETE",
      token,
    }),
};

