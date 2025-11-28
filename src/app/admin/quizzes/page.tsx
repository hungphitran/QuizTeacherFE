'use client';

import Link from "next/link";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChartBarIcon,
  ClockIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/components/providers/AuthProvider";
import { useAuthorizedSWR } from "@/lib/fetchers";
import { quizApi } from "@/services/quizApi";
import { Quiz } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { ensureArrayResponse } from "@/lib/normalizers";

export default function AdminQuizzesPage() {
  const { tokens } = useAuth();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [questionCounts, setQuestionCounts] = useState<Record<number, number>>({});
  const fetchedQuizIds = useRef<Set<number>>(new Set());
  const { data, error, isLoading, mutate } = useAuthorizedSWR<Quiz[]>(
    "/quizzes",
    tokens?.accessToken,
  );
  const quizList = useMemo(() => ensureArrayResponse<Quiz>(data), [data]);

  // Fetch question counts for each quiz
  useEffect(() => {
    if (!tokens?.accessToken || isLoading || quizList.length === 0) return;

    const fetchQuestionCounts = async () => {
      const counts: Record<number, number> = {};
      const quizzesToFetch = quizList.filter(quiz => !fetchedQuizIds.current.has(quiz.id));
      
      if (quizzesToFetch.length === 0) return; // All already fetched

      await Promise.all(
        quizzesToFetch.map(async (quiz) => {
          try {
            const questions = await quizApi.getQuestions(String(quiz.id), undefined, tokens.accessToken);
            counts[quiz.id] = questions.length;
            fetchedQuizIds.current.add(quiz.id);
          } catch (err) {
            counts[quiz.id] = 0;
            fetchedQuizIds.current.add(quiz.id);
          }
        })
      );
      
      if (Object.keys(counts).length > 0) {
        setQuestionCounts(prev => ({ ...prev, ...counts }));
      }
    };

    fetchQuestionCounts();
  }, [quizList, tokens?.accessToken, isLoading]);

  const handleDelete = async (id: number) => {
    if (!tokens?.accessToken) return;
    if (!confirm("Xác nhận xóa bài kiểm tra này?")) return;
    try {
      setDeletingId(id);
      await quizApi.remove(String(id), tokens.accessToken);
      await mutate();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Xóa thất bại");
    } finally {
      setDeletingId(null);
    }
  };

  if (error) {
    return <ErrorState description="Không thể tải danh sách bài kiểm tra." onRetry={() => mutate()} />;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý bài kiểm tra</h1>
          <p className="mt-1 text-sm text-gray-500">
            Tạo mới, chỉnh sửa và theo dõi kết quả bài kiểm tra
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/admin/quizzes/new">
            <PlusIcon className="h-5 w-5" />
            Tạo bài kiểm tra
          </Link>
        </Button>
      </header>

      {isLoading && <LoadingState label="Đang tải danh sách..." />}

      {!isLoading && quizList.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {quizList.map((quiz) => (
            <Card
              key={quiz.id}
              className="transition-all duration-200 hover:shadow-lg"
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
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-xl font-semibold text-gray-900 line-clamp-2">
                      {quiz.title}
                    </h2>
                    {quiz.status && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        quiz.status === "PUBLISHED" 
                          ? "bg-green-100 text-green-700" 
                          : quiz.status === "DRAFT"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {quiz.status === "PUBLISHED" ? "Đã công bố" : quiz.status === "DRAFT" ? "Bản nháp" : "Lưu trữ"}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                    {quiz.description || "Không có mô tả"}
                  </p>
                  {quiz.slug && (
                    <p className="mt-1 text-xs text-gray-400">/{quiz.slug}</p>
                  )}
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
                    <span>{quiz.duration || quiz.timeLimit || 0} phút</span>
                  </div>
                </div>
                
                {(quiz.createdAt || quiz.updatedAt) && (
                  <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                    {quiz.createdAt && (
                      <p>Tạo: {new Date(quiz.createdAt).toLocaleDateString('vi-VN')}</p>
                    )}
                    {quiz.updatedAt && (
                      <p>Cập nhật: {new Date(quiz.updatedAt).toLocaleDateString('vi-VN')}</p>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                  <Button
                    asChild
                    variant="secondary"
                    className="flex-1 gap-1 text-xs"
                  >
                    <Link href={`/admin/quizzes/${quiz.id}/edit`}>
                      <PencilIcon className="h-4 w-4" />
                      Sửa
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    className="flex-1 gap-1 text-xs"
                  >
                    <Link href={`/admin/attempts/${quiz.id}`}>
                      <ChartBarIcon className="h-4 w-4" />
                      Kết quả
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => handleDelete(quiz.id)}
                    disabled={deletingId === quiz.id}
                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {deletingId === quiz.id ? (
                      "Đang xóa..."
                    ) : (
                      <>
                        <TrashIcon className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && quizList.length === 0 && (
        <Card className="py-12 text-center">
          <QuestionMarkCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Chưa có bài kiểm tra</h3>
          <p className="mt-2 text-sm text-gray-500">
            Bắt đầu bằng cách tạo bài kiểm tra đầu tiên của bạn
          </p>
          <div className="mt-6">
            <Button asChild>
              <Link href="/admin/quizzes/new">
                <PlusIcon className="h-5 w-5" />
                Tạo bài kiểm tra
              </Link>
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}


