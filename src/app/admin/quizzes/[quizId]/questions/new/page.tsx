'use client';

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { QuestionForm, QuestionFormValues } from "@/components/quiz/QuestionForm";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { useAuth } from "@/components/providers/AuthProvider";
import { quizApi } from "@/services/quizApi";
import { Quiz } from "@/types";

export default function NewQuestionPage() {
  const params = useParams<{ quizId: string }>();
  const router = useRouter();
  const { tokens } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!tokens?.accessToken) return;
      try {
        const response = await quizApi.getById(params.quizId, tokens.accessToken);
        setQuiz(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không thể tải bài kiểm tra");
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [params.quizId, tokens?.accessToken]);

  const handleSubmit = async (values: QuestionFormValues) => {
    if (!tokens?.accessToken) return;
    setSubmitting(true);
    setError(null);
    try {
      // Get current questions count to set order
      const questions = await quizApi.getQuestions(params.quizId, undefined, tokens.accessToken);
      const order = questions.length;
      
      await quizApi.createQuestion(
        params.quizId,
        {
          content: values.question, // Map question to content
          points: values.points || 1,
          order: order, // Set order based on current questions count
          type: values.type || "SINGLE_CHOICE",
          options: values.options.map((opt, index) => ({
            content: opt.label, // Map label to content
            isCorrect: opt.is_correct ?? false, // Map is_correct to isCorrect (camelCase)
            order: index, // Add order for options
          })),
        },
        tokens.accessToken,
      );
      router.push(`/admin/quizzes/${params.quizId}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể thêm câu hỏi");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState label="Đang tải thông tin bài kiểm tra..." />
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <ErrorState description={error} onRetry={() => router.push(`/admin/quizzes/${params.quizId}/edit`)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href={`/admin/quizzes/${params.quizId}/edit`}>
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Thêm câu hỏi mới</h1>
          <p className="mt-1 text-sm text-gray-500">
            Bài kiểm tra: {quiz?.title}
          </p>
        </div>
      </div>

      <Card className="max-w-4xl">
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}
        <QuestionForm
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
          onCancel={() => router.push(`/admin/quizzes/${params.quizId}/edit`)}
        />
      </Card>
    </div>
  );
}

