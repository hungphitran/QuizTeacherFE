import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-slate-100 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-indigo-100 bg-white p-8 shadow-xl">
        {children}
      </div>
    </div>
  );
}

