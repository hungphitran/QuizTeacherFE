'use client';

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/components/providers/AuthProvider";
import { useAuthorizedSWR } from "@/lib/fetchers";
import {
  PaginatedResponse,
  Quiz,
  QuizAttempt,
  QuizQuestion,
  StudentAnswer,
} from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";

const ANSWERS_LIMIT = 25;

export default function AttemptDetailPage() {
  const params = useParams<{ quizId: string; attemptId: string }>();
  const { tokens } = useAuth();
  const [answersPage, setAnswersPage] = useState(1);

  const quizId = params?.quizId;
  const attemptId = params?.attemptId;
  const isValidQuizId = quizId && !isNaN(Number(quizId));
  const isValidAttemptId = attemptId && !isNaN(Number(attemptId));

  const { data: quiz, error: quizError, isLoading: quizLoading } = useAuthorizedSWR<Quiz>(
    isValidQuizId && tokens?.accessToken ? `/quizzes/${quizId}` : null,
    tokens?.accessToken,
  );

  const {
    data: attempt,
    error: attemptError,
    isLoading: attemptLoading,
  } = useAuthorizedSWR<QuizAttempt>(
    isValidAttemptId && tokens?.accessToken ? `/quiz_attempts/${attemptId}` : null,
    tokens?.accessToken,
  );

  const { data: quizQuestions, isLoading: questionsLoading } = useAuthorizedSWR<QuizQuestion[]>(
    isValidQuizId && tokens?.accessToken ? `/quiz/${quizId}/questions` : null,
    tokens?.accessToken,
  );

  const {
    data: answersResponse,
    error: answersError,
    isLoading: answersLoading,
  } = useAuthorizedSWR<PaginatedResponse<StudentAnswer>>(
    isValidAttemptId && tokens?.accessToken
      ? `/student_answers/${attemptId}?page=${answersPage}&limit=${ANSWERS_LIMIT}`
      : null,
    tokens?.accessToken,
  );

  const answers = answersResponse?.data ?? [];
  const answersMeta = answersResponse?.meta;

  const questions = quiz?.questions?.length ? quiz.questions : quizQuestions;

  const questionMap = useMemo(() => {
    if (!questions || !questions.length) {
      return {};
    }

    return questions.reduce<
      Record<number, { title: string; options: Record<number, string>; correctOptions: number[] }>
    >((map, question) => {
      const normalizedTitle = question.content || question.question || `Câu hỏi ${question.id}`;
      const optionsMap: Record<number, string> = {};
      const correctOptions: number[] = [];

      (question.options || []).forEach((option) => {
        const optionId = option.id;
        const optionLabel = option.content || option.label || option.value || `Lựa chọn ${optionId}`;
        optionsMap[optionId] = optionLabel;

        if (option.is_correct || option.isCorrect) {
          correctOptions.push(optionId);
        }
      });

      map[question.id] = {
        title: normalizedTitle,
        options: optionsMap,
        correctOptions,
      };

      return map;
    }, {});
  }, [questions]);

  if (!isValidQuizId || !isValidAttemptId) {
    return <ErrorState description="Đường dẫn không hợp lệ." />;
  }

  if (!tokens?.accessToken || quizLoading || attemptLoading) {
    return <LoadingState label="Đang tải chi tiết bài làm..." />;
  }

  if (quizError || attemptError || answersError) {
    return (
      <ErrorState
        description="Không thể tải chi tiết bài làm. Vui lòng thử lại sau."
        onRetry={() => window.location.reload()}
      />
    );
  }

  const renderSubmittedBadge = () => (
    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
      Đã nộp
    </span>
  );

  const studentName =
    attempt?.student?.fullName ||
    attempt?.studentName ||
    attempt?.student_name ||
    (attempt?.studentId ? `HS-${attempt.studentId}` : null);
  const studentDobRaw =
    attempt?.student?.dateOfBirth ||
    attempt?.dateOfBirth ||
    attempt?.studentDateOfBirth ||
    attempt?.student_date_of_birth;
  const studentDob = studentDobRaw ? new Date(studentDobRaw).toLocaleDateString("vi-VN") : null;
  const studentClass =
    attempt?.student?.className ||
    attempt?.studentClassName ||
    null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href={`/admin/attempts/${quizId}`}>
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <p className="text-sm text-gray-500">Bài kiểm tra</p>
          <h1 className="text-3xl font-bold text-gray-900">
            {quiz?.title ?? "Đang tải..."}
          </h1>
        </div>
      </div>

      <Card>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4 sm:col-span-2">
            <div className="rounded-full bg-indigo-100 p-2">
              <UserIcon className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Họ và tên học sinh</p>
              <p className="text-base font-semibold text-gray-900">
                {studentName ?? "Chưa có thông tin"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Mã học sinh: {attempt?.studentId ?? "Không xác định"}
              </p>
              {studentClass && (
                <p className="text-xs text-gray-500 mt-1">Lớp: {studentClass}</p>
              )}
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4">
            <div className="rounded-full bg-indigo-100 p-2">
              <CalendarIcon className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Ngày sinh</p>
              <p className="text-base font-semibold text-gray-900">
                {studentDob ?? "Chưa cập nhật"}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4">
            <ClockIcon className="h-5 w-5 text-indigo-600" />
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Bắt đầu</p>
              <p className="text-sm font-medium text-gray-900">
                {attempt?.startedAt || attempt?.start_at
                  ? new Date(attempt.startedAt || attempt.start_at).toLocaleString("vi-VN")
                  : "-"}
              </p>
            </div>
          </div>
          <div className="flex flex-col rounded-lg border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Trạng thái</p>
            {renderSubmittedBadge()}
          </div>
          <div className="flex flex-col rounded-lg border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Điểm</p>
            <p className="text-2xl font-semibold text-gray-900">
              {attempt?.score ?? "Chưa có"}
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Chi tiết câu trả lời</h2>
            <p className="text-sm text-gray-500">
              Đối chiếu lựa chọn của học sinh với đáp án đúng
            </p>
          </div>
          {answersMeta && (
            <div className="text-sm text-gray-500">
              Trang {answersMeta.page} / {answersMeta.totalPages ?? 1} · {answersMeta.total} đáp án
            </div>
          )}
        </div>

        {questionsLoading || answersLoading ? (
          <div className="py-12">
            <LoadingState label="Đang tải câu trả lời..." />
          </div>
        ) : answers.length > 0 ? (
          <div className="space-y-3 pt-4">
            {answers.map((answer) => {
              const questionDetails = questionMap[answer.questionId];
              const questionTitle = questionDetails?.title || `Câu hỏi #${answer.questionId}`;

              const selectedOptionLabel = answer.selectedOptionId
                ? questionDetails?.options?.[answer.selectedOptionId] ??
                  (answer.selected_option
                    ? answer.selected_option
                    : `Lựa chọn #${answer.selectedOptionId}`)
                : answer.selected_option || "Chưa chọn";

              const correctOptionLabels =
                questionDetails?.correctOptions
                  ?.map((optionId) => questionDetails.options[optionId])
                  ?.filter(Boolean) || [];

              return (
                <div
                  key={answer.id}
                  className={`flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between ${
                    answer.is_correct ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {answer.is_correct ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircleIcon className="h-5 w-5 text-red-600" />
                      )}
                      <span className="text-sm font-medium text-gray-900">{questionTitle}</span>
                      <span className="text-xs text-gray-500">#{answer.questionId}</span>
                    </div>
                    <p className="mt-2 text-sm text-gray-700">
                      Đã chọn: <span className="font-medium">{selectedOptionLabel}</span>
                    </p>
                    {!!correctOptionLabels.length && (
                      <p className="text-xs text-gray-600">
                        Đáp án đúng: {correctOptionLabels.join(", ")}
                      </p>
                    )}
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      answer.is_correct ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {answer.is_correct ? "Đúng" : "Sai"}
                  </span>
                </div>
              );
            })}

            {answersMeta && (
              <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <p className="text-sm text-gray-500">
                  Trang {answersMeta.page} / {answersMeta.totalPages ?? 1}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setAnswersPage((prev) => Math.max(1, prev - 1))}
                    disabled={answersMeta.page <= 1}
                  >
                    Trang trước
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setAnswersPage((prev) =>
                        answersMeta.totalPages ? Math.min(answersMeta.totalPages, prev + 1) : prev + 1,
                      )
                    }
                    disabled={
                      answersMeta.totalPages ? answersMeta.page >= answersMeta.totalPages : false
                    }
                  >
                    Trang sau
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-12 text-center text-sm text-gray-500">
            Lượt làm này chưa có câu trả lời nào.
          </div>
        )}
      </Card>
    </div>
  );
}


