'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { QuizForm, QuizFormValues } from "@/components/quiz/QuizForm";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/providers/AuthProvider";
import { quizApi } from "@/services/quizApi";

export default function CreateQuizPage() {
  const router = useRouter();
  const { tokens, user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

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
    if (!tokens?.accessToken || !user) return;
    setSubmitting(true);
    setError(null);
    try {
      const { duration, randomize_questions, randomize_options, allow_multiple, coverImage, status, ...restValues } = values;
      await quizApi.create(
        {
          ...restValues,
          slug: generateSlug(values.title),
          coverImage: coverImage || undefined,
          status: status || "DRAFT",
          creatorId: user.id,
          timeLimit: duration, // Map duration to timeLimit
        },
        tokens.accessToken,
      );
      router.push("/admin/quizzes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tạo bài kiểm tra");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href="/admin/quizzes">
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tạo bài kiểm tra mới</h1>
          <p className="mt-1 text-sm text-gray-500">
            Nhập thông tin cơ bản cho bài kiểm tra mới
          </p>
        </div>
      </div>

      <Card className="max-w-3xl">
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}
        <QuizForm onSubmit={handleSubmit} isLoading={isSubmitting} />
      </Card>
    </div>
  );
}

