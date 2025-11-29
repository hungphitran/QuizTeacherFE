import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";

export const metadata: Metadata = {
  title: "QuizTeacher",
  description: "Quản trị bài kiểm tra và phòng thi cho học sinh",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-gray-900">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
