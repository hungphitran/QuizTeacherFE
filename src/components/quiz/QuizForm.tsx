'use client';

import { useForm, Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Quiz } from "@/types";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

const schema = z.object({
  title: z.string().min(3, "Tiêu đề tối thiểu 3 ký tự"),
  description: z.string().optional(),
  coverImage: z.string().url("URL ảnh bìa không hợp lệ").optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  duration: z.coerce.number().min(1, "Thời lượng tối thiểu 1 phút"),
  randomize_questions: z.boolean().default(true),
  randomize_options: z.boolean().default(true),
  allow_multiple: z.boolean().default(false),
});

export type QuizFormValues = z.infer<typeof schema>;

interface Props {
  defaultValues?: Quiz;
  onSubmit: (values: QuizFormValues) => Promise<void>;
  isLoading?: boolean;
}

export const QuizForm = ({ defaultValues, onSubmit, isLoading }: Props) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<QuizFormValues>({
    resolver: zodResolver(schema) as Resolver<QuizFormValues>,
    defaultValues: defaultValues
      ? {
          title: defaultValues.title,
          description: defaultValues.description,
          coverImage: defaultValues.coverImage || "",
          status: defaultValues.status || "DRAFT",
          duration: defaultValues.duration || defaultValues.timeLimit || 30,
          randomize_options: !!defaultValues.randomize_options,
          randomize_questions: !!defaultValues.randomize_questions,
          allow_multiple: !!defaultValues.allow_multiple,
        }
      : {
          title: "",
          description: "",
          coverImage: "",
          status: "DRAFT",
          duration: 30,
          randomize_questions: true,
          randomize_options: true,
          allow_multiple: false,
        },
  });

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Tiêu đề <span className="text-red-500">*</span>
        </label>
        <Input placeholder="Ví dụ: Kiểm tra Đại số" {...register("title")} />
        {errors.title && (
          <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Mô tả</label>
        <Textarea rows={3} placeholder="Mô tả ngắn về bài kiểm tra..." {...register("description")} />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Ảnh bìa (URL)</label>
        <Input 
          type="url" 
          placeholder="https://example.com/image.jpg" 
          {...register("coverImage")} 
        />
        {errors.coverImage && (
          <p className="text-sm text-red-600 mt-1">{errors.coverImage.message}</p>
        )}
        {watch("coverImage") && (
          <div className="mt-2">
            <img 
              src={watch("coverImage")} 
              alt="Preview" 
              className="w-full h-32 object-cover rounded-lg border border-gray-200"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Trạng thái <span className="text-red-500">*</span>
        </label>
        <select
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          {...register("status")}
        >
          <option value="DRAFT">Bản nháp</option>
          <option value="PUBLISHED">Đã công bố</option>
          <option value="ARCHIVED">Đã lưu trữ</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Thời lượng (phút) <span className="text-red-500">*</span>
        </label>
        <Input type="number" min={1} {...register("duration")} />
        {errors.duration && (
          <p className="text-sm text-red-600 mt-1">{errors.duration.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 mb-3">Tùy chọn</label>
        <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              {...register("randomize_questions")}
            />
            <span className="text-sm text-gray-700">Xáo trộn thứ tự câu hỏi</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              {...register("randomize_options")}
            />
            <span className="text-sm text-gray-700">Xáo trộn thứ tự đáp án</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              {...register("allow_multiple")}
            />
            <span className="text-sm text-gray-700">Cho phép học sinh làm lại nhiều lần</span>
          </label>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <Button type="submit" disabled={isLoading} className="min-w-[140px]">
          {isLoading ? "Đang lưu..." : "Lưu bài kiểm tra"}
        </Button>
      </div>
    </form>
  );
};

