'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import { AcademicCapIcon, ClockIcon, QuestionMarkCircleIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { quizApi } from "@/services/quizApi";
import { Quiz } from "@/types";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { ensureArrayResponse } from "@/lib/normalizers";

export default function Home() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questionCounts, setQuestionCounts] = useState<Record<number, number>>({});
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (hasLoaded) return; // Prevent re-fetching

    const loadQuizzes = async () => {
      try {
        const rawData = await quizApi.getAll(); // Không cần token để xem danh sách
        const normalizedData = ensureArrayResponse<Quiz>(rawData);
        setQuizzes(normalizedData);
        
        // Fetch question counts for each quiz (public quizzes might not need auth)
        const counts: Record<number, number> = {};
        await Promise.all(
          normalizedData.map(async (quiz) => {
            try {
              // Try to get questions count - might fail if auth required
              const questions = await quizApi.getQuestions(String(quiz.id));
              counts[quiz.id] = questions.length;
            } catch (err) {
              // If auth required or error, set to 0 or use fallback
              counts[quiz.id] = quiz.number_of_questions ?? 0;
            }
          })
        );
        setQuestionCounts(counts);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không thể tải danh sách bài kiểm tra");
      } finally {
        setLoading(false);
        setHasLoaded(true);
      }
    };
    loadQuizzes();
  }, [hasLoaded]);

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-br from-indigo-50 via-white to-slate-100">
      {/* Header với nút Quản trị */}
      <header className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="flex items-center gap-2">
          <p className="text-xl font-bold text-indigo-600">QuizTeacher</p>
        </div>
        <Button variant="secondary" asChild>
          <Link href="/login">Quản trị</Link>
        </Button>
      </header>

      {/* Nội dung chính */}
      <div className="flex-1 px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
              Danh sách bài kiểm tra
            </h1>
            <p className="mt-3 text-lg text-gray-600">
              Chọn bài kiểm tra để bắt đầu làm bài
            </p>
          </div>

          {loading && (
            <div className="flex justify-center py-12">
              <LoadingState label="Đang tải danh sách bài kiểm tra..." />
            </div>
          )}

          {error && (
            <ErrorState description={error} />
          )}

          {!loading && !error && quizzes && quizzes.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {quizzes.map((quiz) => (
                <Card
                  key={quiz.id}
                  className="transition-all duration-200 hover:shadow-lg hover:border-indigo-300"
                >
                  <div className="space-y-4">
                    {quiz.coverImage && (
                      <div className="w-full h-32 overflow-hidden rounded-lg">
                        <img 
                          src={quiz.coverImage} 
                          alt={quiz.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 line-clamp-2">
                        {quiz.title}
                      </h2>
                      <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                        {quiz.description || "Không có mô tả"}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <QuestionMarkCircleIcon className="h-4 w-4" />
                        <span>
                          {questionCounts[quiz.id] !== undefined 
                            ? `${questionCounts[quiz.id]} câu` 
                            : quiz.questions?.length ?? quiz.number_of_questions ?? 0} câu
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ClockIcon className="h-4 w-4" />
                        <span>{quiz.timeLimit || 0} phút</span>
                      </div>
                    </div>

                    <Button asChild className="w-full gap-2">
                      <Link href={`/quiz/${quiz.id}/start`}>
                        Bắt đầu làm bài
                        <ArrowRightIcon className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {!loading && !error && (!quizzes || quizzes.length === 0) && (
            <Card className="py-12 text-center">
              <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">Chưa có bài kiểm tra</h3>
              <p className="mt-2 text-sm text-gray-500">
                Hiện tại chưa có bài kiểm tra nào được công bố
              </p>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
