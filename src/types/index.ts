export type UserRole = "admin" | "student";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: number;
  email: string;
  full_name?: string;
  fullName?: string;
  avatar?: string;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  data: {
    user: User;
    tokens: AuthTokens;
  };
  message: string;
  status: number;
}

export interface QuizQuestionOption {
  id?: number;
  label?: string;
  content?: string;
  value?: string;
  is_correct?: boolean;
  isCorrect?: boolean;
  order?: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface QuizQuestion {
  id: number;
  content?: string;
  points?: number;
  order?: number;
  type?: "SINGLE_CHOICE" | "TRUE_FALSE" | "MULTIPLE_CHOICE";
  options: QuizQuestionOption[];
  explanation?: string;
}

export interface Quiz {
  id: number;
  title: string;
  description?: string;
  slug?: string;
  coverImage?: string;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  timeLimit?: number;
  number_of_questions?: number;
  creatorId?: number;
  createdAt?: string;
  updatedAt?: string;
  questions?: QuizQuestion[];
}

export interface QuizPayload
  extends Omit<
    Quiz,
    "id" | "questions" | "description" | "title" | "createdAt" | "updatedAt"
  >,
    Record<string, unknown> {
  title: string;
  description?: string;
  slug: string;
  coverImage?: string;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  creatorId: number;
  timeLimit: number;
}

export interface QuizAttempt {
  id: number;
  quizId: number;
  studentId: number;
  student?: {
    id: number;
    fullName?: string;
    dateOfBirth?: string;
    className?: string;
  };
  studentName?: string;
  student_name?: string;
  dateOfBirth?: string;
  studentDateOfBirth?: string;
  student_date_of_birth?: string;
  studentClassName?: string;
  start_at?: string;
  startedAt?: string;
  end_at?: string;
  finishedAt?: string;
  score?: number | null;
  status?: "in_progress" | "completed" | "expired";
}

export interface StudentAnswer {
  id: number;
  attemptId: number;
  questionId: number;
  selected_option?: string;
  selectedOptionId?: number;
  is_correct?: boolean;
  time_spent?: number;
  createdAt?: string;
}

export interface ApiErrorPayload {
  message: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
}

