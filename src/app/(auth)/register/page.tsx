'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const schema = z
  .object({
    email: z.string().email("Email không hợp lệ"),
    fullName: z.string().min(3, "Họ tên tối thiểu 3 ký tự"),
    password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
    confirmPassword: z.string().min(6, "Nhập lại mật khẩu"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu không khớp",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      const response = await registerUser({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        role: "TEACHER", // Chỉ cho phép đăng ký tài khoản giáo viên
      });
      router.push("/admin/quizzes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng ký thất bại");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Đăng ký tài khoản giáo viên</h1>
        <p className="text-sm text-gray-500">Tạo tài khoản để quản lý bài kiểm tra và theo dõi kết quả học sinh</p>
      </div>

      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className="text-sm font-medium text-gray-700">Email</label>
          <Input type="email" autoComplete="email" {...register("email")} />
          {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Họ và tên</label>
          <Input {...register("fullName")} />
          {errors.fullName && <p className="text-sm text-red-600">{errors.fullName.message}</p>}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-gray-700">Mật khẩu</label>
            <Input type="password" autoComplete="new-password" {...register("password")} />
            {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Nhập lại mật khẩu</label>
            <Input type="password" autoComplete="new-password" {...register("confirmPassword")} />
            {errors.confirmPassword && (
              <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Đang xử lý..." : "Đăng ký"}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500">
        Đã có tài khoản?{" "}
        <Link className="font-medium text-indigo-600 hover:text-indigo-500" href="/login">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}

