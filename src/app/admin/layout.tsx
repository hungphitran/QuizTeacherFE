'use client';

import type { ReactNode } from "react";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AdminSidebar } from "@/components/navigation/AdminSidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="flex-1 bg-slate-50 p-8">{children}</main>
      </div>
    </ProtectedRoute>
  );
}

