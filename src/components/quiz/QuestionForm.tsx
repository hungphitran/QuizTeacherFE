'use client';

import { useForm, useFieldArray, Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { QuizQuestion, QuizQuestionOption } from "@/types";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

const schema = z.object({
  question: z.string().min(3, "Câu hỏi tối thiểu 3 ký tự"),
  explanation: z.string().optional(),
  points: z.coerce.number().min(0.5, "Điểm tối thiểu 0.5").default(1),
  type: z.enum(["SINGLE_CHOICE", "TRUE_FALSE", "MULTIPLE_CHOICE"]).default("SINGLE_CHOICE"),
  options: z
    .array(
      z.object({
        label: z.string().min(1, "Nhãn đáp án không được để trống"),
        value: z.string().min(1, "Giá trị đáp án không được để trống"),
        is_correct: z.boolean().default(false),
      }),
    )
    .min(2, "Phải có ít nhất 2 đáp án")
    .refine(
      (options) => options.some((opt) => opt.is_correct),
      "Phải có ít nhất 1 đáp án đúng",
    ),
});

export type QuestionFormValues = z.infer<typeof schema>;

interface Props {
  defaultValues?: QuizQuestion;
  onSubmit: (values: QuestionFormValues) => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
}

export const QuestionForm = ({ defaultValues, onSubmit, isLoading, onCancel }: Props) => {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<QuestionFormValues>({
    resolver: zodResolver(schema) as Resolver<QuestionFormValues>,
    defaultValues: defaultValues
      ? {
          question: defaultValues.question || defaultValues.content || "",
          explanation: defaultValues.explanation,
          points: defaultValues.points || 1,
          type: defaultValues.type || "SINGLE_CHOICE",
          options: defaultValues.options.map((opt) => ({
            label: opt.label || opt.content || "",
            value: opt.value || "",
            is_correct: opt.is_correct ?? opt.isCorrect ?? false,
          })),
        }
      : {
          question: "",
          explanation: "",
          points: 1,
          type: "SINGLE_CHOICE",
          options: [
            { label: "", value: "A", is_correct: false },
            { label: "", value: "B", is_correct: false },
            { label: "", value: "C", is_correct: false },
            { label: "", value: "D", is_correct: false },
          ],
        },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "options",
  });

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Câu hỏi <span className="text-red-500">*</span>
        </label>
        <Textarea
          rows={3}
          placeholder="Nhập câu hỏi..."
          {...register("question")}
        />
        {errors.question && (
          <p className="text-sm text-red-600 mt-1">{errors.question.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Điểm số <span className="text-red-500">*</span>
          </label>
          <Input 
            type="number" 
            step="0.5" 
            min="0.5" 
            placeholder="1" 
            {...register("points")} 
          />
          {errors.points && (
            <p className="text-sm text-red-600 mt-1">{errors.points.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Loại câu hỏi <span className="text-red-500">*</span>
          </label>
          <select
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            {...register("type")}
          >
            <option value="SINGLE_CHOICE">Chọn một đáp án</option>
            <option value="MULTIPLE_CHOICE">Chọn nhiều đáp án</option>
            <option value="TRUE_FALSE">Đúng/Sai</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Giải thích (tùy chọn)</label>
        <Textarea
          rows={2}
          placeholder="Giải thích đáp án đúng..."
          {...register("explanation")}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            Đáp án <span className="text-red-500">*</span>
          </label>
          <Button
            type="button"
            variant="ghost"
            onClick={() => append({ label: "", value: String.fromCharCode(65 + fields.length), is_correct: false })}
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Thêm đáp án
          </Button>
        </div>

        {fields.map((field, index) => (
          <div key={field.id} className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 w-8">
                  {String.fromCharCode(65 + index)}.
                </span>
                <Input
                  placeholder="Nhập đáp án..."
                  {...register(`options.${index}.label`)}
                />
              </div>
              <div className="ml-10">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    checked={watch(`options.${index}.is_correct`)}
                    onChange={(e) => {
                      // If unchecking, ensure at least one is correct
                      if (!e.target.checked) {
                        const currentOptions = watch("options");
                        const correctCount = currentOptions.filter((opt) => opt.is_correct).length;
                        if (correctCount <= 1) {
                          alert("Phải có ít nhất 1 đáp án đúng");
                          return;
                        }
                      }
                      setValue(`options.${index}.is_correct`, e.target.checked);
                    }}
                  />
                  <span className="text-sm text-gray-700">Đáp án đúng</span>
                </label>
              </div>
              {errors.options?.[index] && (
                <p className="text-sm text-red-600 ml-10">
                  {errors.options[index]?.label?.message || errors.options[index]?.value?.message}
                </p>
              )}
            </div>
            {fields.length > 2 && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => remove(index)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}

        {errors.options && typeof errors.options.message === "string" && (
          <p className="text-sm text-red-600">{errors.options.message}</p>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
            Hủy
          </Button>
        )}
        <Button type="submit" disabled={isLoading} className="min-w-[140px]">
          {isLoading ? "Đang lưu..." : defaultValues ? "Cập nhật câu hỏi" : "Thêm câu hỏi"}
        </Button>
      </div>
    </form>
  );
};

