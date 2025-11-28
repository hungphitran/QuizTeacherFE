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
import { Quiz, QuizQuestion } from "@/types";

export default function EditQuestionPage() {
  const params = useParams<{ quizId: string; questionId: string }>();
  const router = useRouter();
  const { tokens } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!tokens?.accessToken) return;
      try {
        // Fetch quiz and question in parallel
        const [quizResponse, questionResponse] = await Promise.all([
          quizApi.getById(params.quizId, tokens.accessToken),
          quizApi.getQuestionById(params.quizId, params.questionId, tokens.accessToken),
        ]);
        
        setQuiz(quizResponse);
        
        // Normalize question data from backend
        const normalizedQuestion: QuizQuestion = {
          id: questionResponse.id,
          question: (questionResponse as any).content || questionResponse.question || "",
          options: (questionResponse as any).options || (questionResponse as any).body?.options || [],
          explanation: questionResponse.explanation || (questionResponse as any).body?.explanation,
        };
        
        // Normalize options if needed
        if (normalizedQuestion.options && normalizedQuestion.options.length > 0) {
          normalizedQuestion.options = normalizedQuestion.options.map((opt: any, index: number) => ({
            id: opt.id || index,
            label: opt.label || opt.content || "",
            value: opt.value || String.fromCharCode(65 + index),
            is_correct: opt.is_correct ?? opt.isCorrect ?? false,
          }));
        }
        
        setQuestion(normalizedQuestion);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không thể tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.quizId, params.questionId, tokens?.accessToken]);

  const handleSubmit = async (values: QuestionFormValues) => {
    if (!tokens?.accessToken) return;
    setSubmitting(true);
    setError(null);
    try {
      await quizApi.updateQuestion(
        params.quizId,
        params.questionId,
        {
          content: values.question, // Map question to content
          points: values.points,
          type: values.type,
          options: {
            create: values.options.map((opt, index) => ({
              content: opt.label, // Map label to content
              isCorrect: opt.is_correct ?? false, // Map is_correct to isCorrect (camelCase)
              order: index, // Add order for options
            })),
          },
        },
        tokens.accessToken,
      );
      router.push(`/admin/quizzes/${params.quizId}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể cập nhật câu hỏi");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState label="Đang tải thông tin câu hỏi..." />
      </div>
    );
  }

  if (error && !question) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <ErrorState description={error} onRetry={() => router.push(`/admin/quizzes/${params.quizId}/edit`)} />
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card>
          <p className="text-center text-gray-600 mb-4">Không tìm thấy câu hỏi</p>
          <Button onClick={() => router.push(`/admin/quizzes/${params.quizId}/edit`)} className="w-full">
            Quay lại
          </Button>
        </Card>
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
          <h1 className="text-3xl font-bold text-gray-900">Chỉnh sửa câu hỏi</h1>
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
          defaultValues={question}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
          onCancel={() => router.push(`/admin/quizzes/${params.quizId}/edit`)}
        />
      </Card>
    </div>
  );
}

