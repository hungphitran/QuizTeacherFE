'use client';

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { quizApi } from "@/services/quizApi";
import { Quiz } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { studentStorage } from "@/lib/studentStorage";

const schema = z.object({
  name: z.string().min(1, "Vui lòng nhập họ và tên"),
  dateOfBirth: z.string().min(1, "Vui lòng nhập ngày sinh"),
  className: z.string().min(1, "Vui lòng nhập tên lớp"),
});

type FormValues = z.infer<typeof schema>;

export default function QuizStartPage() {
  const params = useParams<{ quizId: string }>();
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const storedStudent = studentStorage.getStudentInfo();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: storedStudent?.name ?? "",
      dateOfBirth: storedStudent?.dateOfBirth ?? "",
      className: storedStudent?.className ?? "",
    },
  });

  useEffect(() => {
    if (hasLoaded) return; // Prevent re-fetching

    const loadQuiz = async () => {
      try {
        const data = await quizApi.getById(params.quizId);
        setQuiz(data);
        
        // If quiz doesn't have questions, try to fetch them to get count
        if (!data.questions || data.questions.length === 0) {
          try {
            const questions = await quizApi.getQuestions(params.quizId);
            setQuiz({ ...data, questions });
          } catch (err) {
            // Ignore error, just use the quiz data as is
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không thể tải bài kiểm tra");
      } finally {
        setLoading(false);
        setHasLoaded(true);
      }
    };
    loadQuiz();
  }, [params.quizId, hasLoaded]);

  const onSubmit = async (values: FormValues) => {
    try {
      // Lưu thông tin học sinh
      studentStorage.saveStudentInfo({
        name: values.name,
        dateOfBirth: values.dateOfBirth,
        className: values.className,
      });

      // Kiểm tra xem có attempt cũ không
      const existingAttempt = studentStorage.getLocalAttemptByQuizId(Number(params.quizId));
      if (existingAttempt) {
        // Kiểm tra xem thời gian đã hết chưa
        const timeLimit = quiz?.duration || quiz?.timeLimit || 60;
        const endTime = new Date(new Date(existingAttempt.startAt).getTime() + timeLimit * 60 * 1000);
        if (endTime < new Date()) {
          // Thời gian đã hết, xóa attempt cũ để cho phép làm lại
          studentStorage.removeLocalAttemptByQuizId(Number(params.quizId));
        }
        // Nếu thời gian chưa hết, giữ lại attempt để học sinh có thể tiếp tục làm
        // Học sinh vẫn có thể làm lại bằng cách xóa attempt trong localStorage hoặc đợi hết thời gian
      }

      // Chuyển đến trang làm bài
      router.push(`/quiz/${params.quizId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể bắt đầu làm bài");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState label="Đang tải thông tin bài kiểm tra..." />
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card>
          <ErrorState description={error || "Không tìm thấy bài kiểm tra"} />
          <Button className="mt-4 w-full" asChild>
            <Link href="/">Quay lại trang chủ</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-100 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/">
            <ArrowLeftIcon className="h-5 w-5" />
            Quay lại
          </Link>
        </Button>

        <Card className="mb-6 bg-gradient-to-br from-indigo-50 to-white border-indigo-200">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">{quiz.title}</h1>
            <p className="text-gray-600">{quiz.description || "Không có mô tả"}</p>
            <div className="flex items-center gap-4 pt-4 text-sm text-gray-600">
              <span>{quiz.questions?.length ?? quiz.number_of_questions ?? 0} câu hỏi</span>
              <span>•</span>
              <span>{quiz.duration || quiz.timeLimit || 0} phút</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Thông tin học sinh</h2>
            <p className="mt-1 text-sm text-gray-500">
              Vui lòng điền đầy đủ thông tin để bắt đầu làm bài
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="Nhập họ và tên đầy đủ"
                {...register("name")}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Ngày sinh <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                {...register("dateOfBirth")}
              />
              {errors.dateOfBirth && (
                <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tên lớp <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="VD: 12A1"
                {...register("className")}
              />
              {errors.className && (
                <p className="mt-1 text-sm text-red-600">{errors.className.message}</p>
              )}
            </div>

            <div className="pt-4 border-t border-gray-200">
              <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
                {isSubmitting ? "Đang xử lý..." : "Bắt đầu làm bài"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

