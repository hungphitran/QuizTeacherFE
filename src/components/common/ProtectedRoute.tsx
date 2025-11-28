'use client';

import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { UserRole } from "@/types";
import { LoadingState } from "./LoadingState";

interface Props {
  children: ReactNode;
  role?: UserRole;
}

export const ProtectedRoute = ({ children, role }: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, initializing } = useAuth();

  useEffect(() => {
    // Đợi cho đến khi auth đã khởi tạo xong
    if (initializing) {
      return;
    }

    // Nếu không có user, redirect đến login (trừ khi đã ở trang auth hoặc trang chủ)
    if (!user) {
      const authPaths = ["/login", "/register", "/"];
      if (!authPaths.includes(pathname)) {
        router.replace("/login");
      }
      return;
    }

    // Nếu có role requirement và user role không khớp, redirect
    if (role && user.role !== role) {
      const targetPath = user.role === "admin" ? "/admin/quizzes" : "/";
      // Kiểm tra xem pathname có bắt đầu với targetPath không
      if (!pathname.startsWith(targetPath)) {
        router.replace(targetPath);
      }
    }
  }, [user, initializing, role, router, pathname]);

  // Hiển thị loading khi đang khởi tạo
  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState label="Đang kiểm tra phiên đăng nhập..." />
      </div>
    );
  }

  // Nếu không có user
  if (!user) {
    // Cho phép truy cập trang auth và trang chủ
    const authPaths = ["/login", "/register", "/"];
    if (authPaths.includes(pathname)) {
      return <>{children}</>;
    }
    // Các trang khác sẽ bị redirect (hiển thị loading trong lúc redirect)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState label="Đang chuyển hướng..." />
      </div>
    );
  }

  // Nếu có role requirement và role không khớp
  if (role && user.role !== role) {
    const targetPath = user.role === "admin" ? "/admin/quizzes" : "/";
    // Nếu đã ở đúng trang target, không render gì (để layout khác xử lý)
    if (pathname.startsWith(targetPath)) {
      return null;
    }
    // Nếu đang ở trang không thuộc role này, return null ngay (tránh render conflict)
    // Router sẽ tự động redirect
    if (pathname.startsWith("/admin")) {
      return null;
    }
    // Các trường hợp khác, hiển thị loading (đang redirect)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState label="Đang chuyển hướng..." />
      </div>
    );
  }

  // Nếu mọi thứ đều ổn, render children
  return <>{children}</>;
};

