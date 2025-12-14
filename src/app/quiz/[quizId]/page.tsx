'use client';

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { quizApi } from "@/services/quizApi";
import { Quiz, QuizAttempt } from "@/types";
import { Card } from "@/components/ui/Card";
import { LoadingState } from "@/components/common/LoadingState";
import { useCountdown } from "@/hooks/useCountdown";
import { Button } from "@/components/ui/Button";
import { studentStorage } from "@/lib/studentStorage";
import { useAuth } from "@/components/providers/AuthProvider";

export default function QuizPage() {
  const params = useParams<{ quizId: string }>();
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [serverAttemptId, setServerAttemptId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const studentInfo = studentStorage.getStudentInfo();
  const { tokens } = useAuth();

  useEffect(() => {
    if (hasLoaded) return; // Prevent re-fetching
    
    if (!studentInfo) {
      router.push('/');
      return;
    }

    const loadQuiz = async () => {
      try {
        const data = await quizApi.getById(params.quizId); // Không cần token
        let questions = data.questions || [];
        
        // If quiz doesn't have questions, fetch them separately
        if (!questions || questions.length === 0) {
          try {
            questions = await quizApi.getQuestions(params.quizId);
          } catch (err) {
            console.error("Error fetching questions:", err);
            questions = [];
          }
        }
        
        // Normalize questions data from backend
        const normalizedQuestions = questions.map((q: any) => ({
          id: q.id,
          content: q.content || "",
          points: q.points || 1,
          order: q.order ?? 0,
          type: q.type || "SINGLE_CHOICE",
          options: (q.options || []).map((opt: any, index: number) => ({
            id: opt.id || index,
            content: opt.content || opt.label || "",
            value: opt.value || String.fromCharCode(65 + index),
            isCorrect: opt.isCorrect ?? opt.is_correct ?? false,
          })),
          explanation: q.explanation,
        }));
        
        const normalizedQuiz = {
          ...data,
          questions: normalizedQuestions,
        };
        
        setQuiz(normalizedQuiz);
        
        // Kiểm tra xem đã có attempt đang làm (chưa nộp) trong localStorage chưa
        const existingAttempt = studentStorage.getLocalAttemptByQuizId(Number(params.quizId));
        
        let savedStartTime: Date;
        let savedAnswers: Record<number, string> = {};
        
        if (existingAttempt) {
          // Kiểm tra xem thời gian đã hết chưa
          const timeLimit = data.timeLimit || 60;
          const endTime = new Date(new Date(existingAttempt.startAt).getTime() + timeLimit * 60 * 1000);
          
          // Nếu thời gian chưa hết, khôi phục attempt đang làm
          if (endTime >= new Date()) {
            savedStartTime = new Date(existingAttempt.startAt);
            savedAnswers = existingAttempt.answers || {};
          } else {
            // Thời gian đã hết, tạo attempt mới
            // Xóa attempt cũ
            studentStorage.removeLocalAttemptByQuizId(Number(params.quizId));
            const attemptId = `local_${Date.now()}`;
            savedStartTime = new Date();
            studentStorage.saveLocalAttempt({
              attemptId,
              quizId: data.id,
              studentInfo,
              startAt: savedStartTime.toISOString(),
              answers: {},
            });
          }
        } else {
          // Tạo attempt mới
          const attemptId = `local_${Date.now()}`;
          savedStartTime = new Date();
          studentStorage.saveLocalAttempt({
            attemptId,
            quizId: data.id,
            studentInfo,
            startAt: savedStartTime.toISOString(),
            answers: {},
          });
        }
        
        setStartTime(savedStartTime);
        setAnswers(savedAnswers);

        // Không tạo attempt khi bắt đầu làm bài để tránh lỗi
        // Sẽ tạo attempt khi nộp bài
        const localAttemptId = Object.keys(studentStorage.getLocalAttempts()).find(
          (id) => studentStorage.getLocalAttempt(id)?.quizId === data.id
        );
        
        if (localAttemptId) {
          // Khôi phục serverAttemptId nếu đã có từ lần làm trước
          const localAttempt = studentStorage.getLocalAttempt(localAttemptId);
          if (localAttempt?.serverAttemptId) {
            setServerAttemptId(localAttempt.serverAttemptId);
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
  }, [params.quizId, router, hasLoaded, studentInfo, tokens]);

  const endTime = useMemo(() => {
    if (!quiz || !startTime) return null;
    const timeLimit = quiz.timeLimit || 60;
    return new Date(startTime.getTime() + timeLimit * 60 * 1000);
  }, [quiz, startTime]);

  const { minutes, seconds, isExpired } = useCountdown(endTime);

  const handleAnswerChange = async (questionId: number, selectedOption: string, questionType?: string) => {
    const currentAnswer = answers[questionId];
    let newAnswer: string;
    
    if (questionType === "MULTIPLE_CHOICE") {
      // Handle multiple choice - toggle option
      const currentAnswers = currentAnswer ? currentAnswer.split(',') : [];
      if (currentAnswers.includes(selectedOption)) {
        // Remove if already selected
        newAnswer = currentAnswers.filter(a => a !== selectedOption).join(',');
      } else {
        // Add if not selected
        newAnswer = [...currentAnswers, selectedOption].join(',');
      }
    } else {
      // Single choice - replace
      newAnswer = selectedOption;
    }
    
    const newAnswers = { ...answers, [questionId]: newAnswer };
    setAnswers(newAnswers);
    
    // Lưu vào localStorage
    const attempts = studentStorage.getLocalAttempts();
    const attemptId = Object.keys(attempts).find(
      (id) => attempts[id].quizId === Number(params.quizId)
    );
    if (attemptId) {
      studentStorage.updateAnswer(attemptId, questionId, newAnswer);
      
      // Lưu vào database nếu có serverAttemptId (không cần token nữa)
      const localAttempt = studentStorage.getLocalAttempt(attemptId);
      if (localAttempt?.serverAttemptId) {
        try {
          // Tìm option ID từ selectedOption value
          const question = quiz?.questions?.find(q => q.id === questionId);
          const option = question?.options?.find(opt => opt.value === selectedOption);
          
          if (option?.id) {
            await quizApi.submitAnswer(
              {
                attemptId: localAttempt.serverAttemptId,
                questionId: questionId,
                selectedOptionId: option.id,
              },
              tokens?.accessToken, // Optional token
            );
          }
        } catch (err) {
          console.error("Không thể lưu đáp án vào database:", err);
          // Tiếp tục với localStorage nếu không thể lưu vào database
        }
      }
    }
  };

  const handleSubmit = async () => {
    if (!confirm("Bạn có chắc chắn muốn nộp bài? Sau khi nộp, bạn có thể làm lại bài này.")) {
      return;
    }
    
    setSaving(true);
    setSubmitted(true);
    
    try {
      const attempts = studentStorage.getLocalAttempts();
      const attemptId = Object.keys(attempts).find(
        (id) => attempts[id].quizId === Number(params.quizId)
      );
      
      if (!attemptId) {
        throw new Error("Không tìm thấy attempt");
      }
      
      const localAttempt = studentStorage.getLocalAttempt(attemptId);
      if (!localAttempt) {
        throw new Error("Không tìm thấy attempt data");
      }

      let currentServerAttemptId = localAttempt.serverAttemptId;

      // Nếu chưa có serverAttemptId, thử tạo attempt trong database
      if (!currentServerAttemptId && studentInfo?.name && studentInfo?.dateOfBirth) {
        // Chỉ gửi các field cần thiết theo API doc
        const attemptPayload: {
          quizId: number;
          studentName: string;
          dateOfBirth: string;
          className?: string;
        } = {
          quizId: Number(params.quizId),
          studentName: studentInfo.name,
          dateOfBirth: studentInfo.dateOfBirth,
        };

        if (studentInfo.className) {
          attemptPayload.className = studentInfo.className;
        }

        try {
          const attempt = await quizApi.startAttempt(
            attemptPayload,
            tokens?.accessToken, // Optional token
          );
          currentServerAttemptId = attempt.id;
          setServerAttemptId(attempt.id);
          
          // Cập nhật localStorage với serverAttemptId
          studentStorage.saveLocalAttempt({
            ...localAttempt,
            serverAttemptId: attempt.id,
          });
        } catch (err) {
          console.error("Không thể tạo attempt trong database:", err);
          // Log chi tiết lỗi để debug
          if (err instanceof Error) {
            console.error("Error details:", {
              message: err.message,
              name: err.name,
              payload: attemptPayload,
            });
          }
          // Tiếp tục với localStorage nếu không thể tạo attempt
          // Vẫn cho phép nộp bài, chỉ không lưu vào database
          // Không throw error để không block việc nộp bài
        }
      }

      // Lưu tất cả answers vào database nếu có serverAttemptId (không cần token nữa)
      if (currentServerAttemptId) {
        const savedAnswers: Set<string> = new Set(); // Track đã lưu để tránh duplicate
        
        for (const [questionIdStr, selectedOption] of Object.entries(localAttempt.answers)) {
          const questionId = Number(questionIdStr);
          const question = quiz?.questions?.find(q => q.id === questionId);
          
          if (question && selectedOption) {
            // Xử lý multiple choice
            if (question.type === "MULTIPLE_CHOICE") {
              const selectedOptions = selectedOption.split(',').filter(Boolean);
              for (const optionValue of selectedOptions) {
                const option = question.options?.find(opt => opt.value === optionValue);
                if (option?.id) {
                  const answerKey = `${questionId}-${option.id}`;
                  if (!savedAnswers.has(answerKey)) {
                    try {
                      await quizApi.submitAnswer(
                        {
                          attemptId: currentServerAttemptId,
                          questionId: questionId,
                          selectedOptionId: option.id,
                        },
                        tokens?.accessToken, // Optional token
                      );
                      savedAnswers.add(answerKey);
                    } catch (err) {
                      console.error(`Không thể lưu đáp án cho câu ${questionId}, option ${option.id}:`, err);
                    }
                  }
                }
              }
            } else {
              // Single choice
              const option = question.options?.find(opt => opt.value === selectedOption);
              if (option?.id) {
                const answerKey = `${questionId}-${option.id}`;
                if (!savedAnswers.has(answerKey)) {
                  try {
                    await quizApi.submitAnswer(
                      {
                        attemptId: currentServerAttemptId,
                        questionId: questionId,
                        selectedOptionId: option.id,
                      },
                      tokens?.accessToken, // Optional token
                    );
                    savedAnswers.add(answerKey);
                  } catch (err) {
                    console.error(`Không thể lưu đáp án cho câu ${questionId}:`, err);
                  }
                }
              }
            }
          }
        }
        
        console.log("Đã lưu bài làm vào database thành công");
      } else {
        console.warn("Không thể lưu vào database: thiếu serverAttemptId");
      }
    } catch (err) {
      console.error("Lỗi khi lưu bài làm:", err);
      // Không hiển thị alert để không làm gián đoạn quá trình nộp bài
      // Chỉ log lỗi, vẫn tiếp tục để xóa localStorage và redirect
      // Bài làm đã được lưu vào localStorage
    } finally {
      setSaving(false);
      
      // Xóa attempt khỏi localStorage sau khi nộp bài để cho phép làm lại
      studentStorage.removeLocalAttemptByQuizId(Number(params.quizId));
      
      alert("Bạn đã nộp bài thành công! Bạn có thể làm lại bài này bất cứ lúc nào.");
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState label="Đang tải bài kiểm tra..." />
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card>
          <p className="text-center text-red-600">{error || "Không tìm thấy bài kiểm tra"}</p>
          <Button className="mt-4 w-full" onClick={() => router.push('/')}>
            Quay lại trang chủ
          </Button>
        </Card>
      </div>
    );
  }

  if (!studentInfo) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-100 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <Card className="mb-6">
          {quiz.coverImage && (
            <div className="mb-4 w-full h-48 overflow-hidden rounded-lg">
              <img 
                src={quiz.coverImage} 
                alt={quiz.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-gray-900">{quiz.title}</h1>
              {quiz.description && (
                <p className="text-sm text-gray-600 mt-2">{quiz.description}</p>
              )}
              <div className="mt-3 space-y-1">
                <p className="text-sm text-gray-500">
                  <span className="font-medium">Học sinh:</span> {studentInfo.name}
                </p>
                {studentInfo.dateOfBirth && (
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Ngày sinh:</span> {new Date(studentInfo.dateOfBirth).toLocaleDateString('vi-VN')}
                  </p>
                )}
                {studentInfo.className && (
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Lớp:</span> {studentInfo.className}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-500 pt-2">
                  <span>
                    <span className="font-medium">Số câu hỏi:</span> {quiz.questions?.length || 0}
                  </span>
                  <span>•</span>
                  <span>
                    <span className="font-medium">Thời lượng:</span> {quiz.timeLimit || 0} phút
                  </span>
                  {quiz.questions && quiz.questions.length > 0 && (
                    <>
                      <span>•</span>
                      <span>
                        <span className="font-medium">Tổng điểm:</span> {quiz.questions.reduce((sum, q) => sum + (q.points || 1), 0)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="rounded-lg bg-indigo-50 px-4 py-2 text-center min-w-[120px]">
              <p className="text-xs uppercase text-indigo-500 font-medium">Thời gian còn lại</p>
              <p className={`text-2xl font-bold ${isExpired ? "text-red-600" : "text-indigo-700"}`}>
                {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
              </p>
            </div>
          </div>
          {isExpired && (
            <p className="mt-4 text-sm text-red-600 font-medium">⚠️ Thời gian đã hết. Vui lòng nộp bài.</p>
          )}
        </Card>

        <div className="space-y-6">
          {quiz.questions && quiz.questions.length > 0 ? (
            quiz.questions.map((question, index) => (
              <Card key={question.id} className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-indigo-600">Câu {index + 1}</span>
                      {question.points && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {question.points} điểm
                        </span>
                      )}
                      {question.type && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {question.type === "SINGLE_CHOICE" ? "Chọn một" : question.type === "MULTIPLE_CHOICE" ? "Chọn nhiều" : "Đúng/Sai"}
                        </span>
                      )}
                    </div>
                    <p className="text-base font-medium text-gray-900 leading-relaxed">
                      {question.content}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  {question.options && question.options.length > 0 ? (
                    question.options.map((option, optIndex) => (
                      <label
                        key={option.id || optIndex}
                        className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                          answers[question.id] === option.value
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-gray-200 hover:bg-gray-50"
                        } ${submitted || isExpired ? "opacity-60 cursor-not-allowed" : ""}`}
                      >
                        <input
                          type={question.type === "MULTIPLE_CHOICE" ? "checkbox" : "radio"}
                          name={question.type === "MULTIPLE_CHOICE" ? `question-${question.id}-${option.id}` : `question-${question.id}`}
                          value={option.value}
                          checked={
                            question.type === "MULTIPLE_CHOICE"
                              ? (answers[question.id]?.split(',').includes(option.value ?? "") ?? false)
                              : answers[question.id] === option.value
                          }
                          onChange={() => handleAnswerChange(question.id, option.value ?? "", question.type)}
                          disabled={submitted || isExpired}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="flex-1 text-gray-900">{option.label || option.content || ""}</span>
                      </label>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 italic">Chưa có đáp án</p>
                  )}
                </div>
                {question.explanation && submitted && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <span className="font-medium">Giải thích:</span> {question.explanation}
                    </p>
                  </div>
                )}
              </Card>
            ))
          ) : (
            <Card>
              <p className="text-center text-gray-500 py-8">Chưa có câu hỏi nào trong bài kiểm tra này.</p>
            </Card>
          )}
        </div>

        <Card className="mt-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Đã trả lời: {Object.keys(answers).length} / {quiz.questions?.length || 0} câu
            </p>
            <Button
              onClick={handleSubmit}
              disabled={submitted || (isExpired && Object.keys(answers).length === 0)}
              className="min-w-[120px]"
            >
              {submitted ? "Đã nộp bài" : "Nộp bài"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

