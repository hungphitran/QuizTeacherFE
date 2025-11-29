'use client';

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeftIcon, EyeIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/components/providers/AuthProvider";
import { useAuthorizedSWR } from "@/lib/fetchers";
import { PaginatedResponse, Quiz, QuizAttempt } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { Input } from "@/components/ui/Input";

export default function QuizAttemptsPage() {
  const params = useParams<{ quizId: string }>();
  const { tokens } = useAuth();
  const [attemptsPage, setAttemptsPage] = useState(1);
  const attemptsLimit = 10;
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");

  // Validate quizId
  const quizId = params?.quizId;
  const isValidQuizId = quizId && !isNaN(Number(quizId));

  const { data: quiz, error: quizError, isLoading: quizLoading } = useAuthorizedSWR<Quiz>(
    isValidQuizId && tokens?.accessToken ? `/quizzes/${quizId}` : null,
    tokens?.accessToken,
  );

  const attemptsEndpoint = useMemo(() => {
    if (!isValidQuizId || !tokens?.accessToken) return null;
    const search = new URLSearchParams({
      page: String(attemptsPage),
      limit: String(attemptsLimit),
    });
    if (debouncedKeyword) {
      search.set("keyword", debouncedKeyword);
    }
    return `/quiz_attempts_by_quiz_id/${quizId}?${search.toString()}`;
  }, [attemptsPage, attemptsLimit, debouncedKeyword, isValidQuizId, quizId, tokens?.accessToken]);

  const {
    data: attemptsResponse,
    error: attemptsError,
    isLoading,
  } = useAuthorizedSWR<PaginatedResponse<QuizAttempt>>(attemptsEndpoint, tokens?.accessToken);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedKeyword(keyword.trim());
    }, 400);
    return () => clearTimeout(timeout);
  }, [keyword]);

  useEffect(() => {
    setAttemptsPage(1);
  }, [debouncedKeyword]);

  const attempts = attemptsResponse?.data ?? [];
  const attemptsMeta = attemptsResponse?.meta;

  const getStudentName = (attempt: QuizAttempt) =>
    attempt.student?.fullName ||
    attempt.studentName ||
    attempt.student_name ||
    (attempt.studentId ? `HS-${attempt.studentId}` : "Không xác định");

  const getStudentDob = (attempt: QuizAttempt) => {
    const dob =
      attempt.student?.dateOfBirth ||
      attempt.dateOfBirth ||
      attempt.studentDateOfBirth ||
      attempt.student_date_of_birth;
    return dob ? new Date(dob).toLocaleDateString("vi-VN") : null;
  };

  const getStudentClass = (attempt: QuizAttempt) =>
    attempt.student?.className || attempt.studentClassName || null;

  // Validate quizId first
  if (!isValidQuizId) {
    return (
      <ErrorState 
        description="ID bài kiểm tra không hợp lệ." 
      />
    );
  }

  if (quizLoading || !tokens?.accessToken) {
    return <LoadingState label="Đang tải..." />;
  }

  if (quizError) {
    return (
      <ErrorState 
        description="Không thể tải thông tin bài kiểm tra. Có thể bài kiểm tra không tồn tại." 
      />
    );
  }

  if (attemptsError) {
    return (
      <ErrorState 
        description="Không thể tải danh sách lượt làm bài." 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/admin/quizzes">
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Kết quả: {quiz?.title ?? "Đang tải..."}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Theo dõi lượt làm bài của học sinh cho đề thi này
            </p>
          </div>
        </div>
        <div className="relative w-full max-w-sm">
          <Input
            placeholder="Tìm theo tên, mã HS..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="pl-10"
          />
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {isLoading && <LoadingState label="Đang tải lượt làm bài..." />}

      {!isLoading && attempts && attempts.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Attempt #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Học sinh
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Bắt đầu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Điểm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Xem chi tiết
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {attempts.map((attempt) => (
                  <tr key={attempt.id} className="hover:bg-gray-50 transition-colors">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      #{attempt.id}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{getStudentName(attempt)}</span>
                        <span className="text-xs text-gray-500">
                          Mã HS: {attempt.studentId ?? "N/A"}
                        </span>
                        {getStudentDob(attempt) && (
                          <span className="text-xs text-gray-500">
                            Ngày sinh: {getStudentDob(attempt)}
                          </span>
                        )}
                        {getStudentClass(attempt) && (
                          <span className="text-xs text-gray-500">
                            Lớp: {getStudentClass(attempt)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {(() => {
                        const startedAt = attempt.startedAt ?? attempt.start_at;
                        return startedAt
                          ? new Date(startedAt).toLocaleString("vi-VN")
                          : "-";
                      })()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">
                      {attempt.score ?? "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <Button asChild variant="ghost" className="gap-2 text-indigo-600">
                        <Link href={`/admin/attempts/${quizId}/${attempt.id}`}>
                          <EyeIcon className="h-4 w-4" />
                          Xem bài làm
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {attemptsMeta && (
            <div className="flex flex-col gap-2 border-t border-gray-100 px-6 py-4 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
              <span>
                Trang {attemptsMeta.page} / {attemptsMeta.totalPages ?? 1} · Tổng{" "}
                {attemptsMeta.total} lượt làm
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setAttemptsPage((prev) => Math.max(1, prev - 1))}
                  disabled={attemptsMeta.page <= 1}
                >
                  Trang trước
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    setAttemptsPage((prev) =>
                      attemptsMeta.totalPages ? Math.min(attemptsMeta.totalPages, prev + 1) : prev + 1,
                    )
                  }
                  disabled={attemptsMeta.totalPages ? attemptsMeta.page >= attemptsMeta.totalPages : false}
                >
                  Trang sau
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {!isLoading && !attempts?.length && (
        <Card className="py-12 text-center">
          <p className="text-gray-500">
            {debouncedKeyword
              ? "Không tìm thấy lượt làm nào khớp với từ khóa."
              : "Chưa có học sinh nào làm bài kiểm tra này."}
          </p>
        </Card>
      )}
    </div>
  );
}

