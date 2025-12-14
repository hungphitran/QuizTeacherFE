'use client';

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import { QuizForm, QuizFormValues } from "@/components/quiz/QuizForm";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/common/LoadingState";
import { useAuth } from "@/components/providers/AuthProvider";
import { quizApi } from "@/services/quizApi";
import { Quiz, QuizQuestion } from "@/types";

export default function EditQuizPage() {
  const params = useParams<{ quizId: string }>();
  const router = useRouter();
  const { tokens } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingQuestionId, setDeletingQuestionId] = useState<number | null>(null);

  // Validate quizId is a valid number
  const quizId = params.quizId;
  const isValidQuizId = quizId && !isNaN(Number(quizId));

  useEffect(() => {
    if (!isValidQuizId) {
      setError("ID bài kiểm tra không hợp lệ");
      setLoading(false);
      return;
    }

    const fetchQuiz = async () => {
      if (!tokens?.accessToken) {
        setLoading(false);
        return;
      }
      try {
        const response = await quizApi.getById(quizId, tokens.accessToken);
        setQuiz(response);
      } catch (err) {
        console.error("Error fetching quiz:", err);
        setError(err instanceof Error ? err.message : "Không thể tải bài kiểm tra");
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [quizId, tokens?.accessToken, isValidQuizId]);

  useEffect(() => {
    if (!isValidQuizId || loading) return;

    const fetchQuestions = async () => {
      if (!tokens?.accessToken) return;
      try {
        const response = await quizApi.getQuestions(quizId, undefined, tokens.accessToken);
        // Normalize questions data from backend
        const normalizedQuestions = response.map((q: any) => ({
          id: q.id,
          question: q.content || q.question || "", // Backend may return 'content' instead of 'question'
          options: q.options || q.body?.options || [], // Handle different structures
          explanation: q.explanation || q.body?.explanation,
        }));
        setQuestions(normalizedQuestions);
      } catch (err) {
        // Questions might not exist yet, that's okay
        console.error("Error loading questions:", err);
        setQuestions([]);
      } finally {
        setLoadingQuestions(false);
      }
    };
    fetchQuestions();
  }, [quizId, tokens?.accessToken, loading, isValidQuizId]);

  const handleDeleteQuestion = async (questionId: number) => {
    if (!tokens?.accessToken || !isValidQuizId) return;
    if (!confirm("Xác nhận xóa câu hỏi này?")) return;
    try {
      setDeletingQuestionId(questionId);
      await quizApi.deleteQuestion(quizId, String(questionId), tokens.accessToken);
      setQuestions(questions.filter((q) => q.id !== questionId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Xóa câu hỏi thất bại");
    } finally {
      setDeletingQuestionId(null);
    }
  };

  // Helper function to generate slug from title
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove Vietnamese diacritics
      .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with dash
      .replace(/^-+|-+$/g, "") // Remove leading/trailing dashes
      .substring(0, 100); // Limit length
  };

  const handleSubmit = async (values: QuizFormValues) => {
    if (!tokens?.accessToken || !quiz) return;
    setSaving(true);
    setError(null);
    try {
      const { duration, randomize_questions, randomize_options, allow_multiple, coverImage, status, ...restValues } = values;
      await quizApi.update(
        quizId,
        {
          ...restValues,
          slug: generateSlug(values.title),
          coverImage: coverImage || undefined,
          status: status || quiz?.status || "DRAFT",
          timeLimit: duration, // Map duration to timeLimit
        },
        tokens.accessToken,
      );
      router.push("/admin/quizzes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể cập nhật bài kiểm tra");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState label="Đang tải bài kiểm tra..." />
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card>
          <p className="text-center text-red-600 mb-4">{error}</p>
          <Button onClick={() => router.push("/admin/quizzes")} className="w-full">
            Quay lại danh sách
          </Button>
        </Card>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card>
          <p className="text-center text-gray-600 mb-4">Không tìm thấy bài kiểm tra</p>
          <Button onClick={() => router.push("/admin/quizzes")} className="w-full">
            Quay lại danh sách
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href="/admin/quizzes">
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Chỉnh sửa bài kiểm tra</h1>
          <p className="mt-1 text-sm text-gray-500">
            Cập nhật thông tin cho: {quiz.title}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="max-w-3xl">
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}
          <QuizForm defaultValues={quiz ?? undefined} onSubmit={handleSubmit} isLoading={saving} />
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Danh sách câu hỏi</h2>
            <Button asChild className="gap-2 text-sm px-3 py-1.5">
              <Link href={`/admin/quizzes/${quizId}/questions/new`}>
                <PlusIcon className="h-4 w-4" />
                Thêm câu hỏi
              </Link>
            </Button>
          </div>

          {loadingQuestions ? (
            <LoadingState label="Đang tải câu hỏi..." />
          ) : questions.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <p>Chưa có câu hỏi nào</p>
              <Button asChild variant="ghost" className="mt-4">
                <Link href={`/admin/quizzes/${quizId}/questions/new`}>
                  Thêm câu hỏi đầu tiên
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div
                  key={question.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-500">Câu {index + 1}:</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 mb-3">{question.content}</p>
                      <div className="space-y-1">
                        {question.options && question.options.length > 0 ? (
                          question.options.map((option: any, optIndex: number) => (
                            <div
                              key={option.id || optIndex}
                              className={`flex items-center gap-2 text-sm ${
                                option.is_correct || option.isCorrect ? "text-green-700 font-medium" : "text-gray-600"
                              }`}
                            >
                              {(option.is_correct || option.isCorrect) && (
                                <CheckCircleIcon className="h-4 w-4 text-green-600" />
                              )}
                              <span>
                                {option.value || String.fromCharCode(65 + optIndex)}. {option.label || option.content || ""}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 italic">Chưa có đáp án</p>
                        )}
                      </div>
                      {question.explanation && (
                        <p className="mt-2 text-xs text-gray-500 italic">
                          Giải thích: {question.explanation}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        asChild
                        className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 text-sm px-3 py-1.5"
                      >
                        <Link href={`/admin/quizzes/${quizId}/questions/${question.id}/edit`}>
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleDeleteQuestion(question.id)}
                        disabled={deletingQuestionId === question.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 text-sm px-3 py-1.5"
                      >
                        {deletingQuestionId === question.id ? (
                          "Đang xóa..."
                        ) : (
                          <TrashIcon className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

