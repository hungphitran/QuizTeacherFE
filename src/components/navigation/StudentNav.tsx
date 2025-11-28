'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AcademicCapIcon, HomeIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/components/providers/AuthProvider";

const links = [
  { href: "/student/dashboard", label: "Dashboard", icon: HomeIcon },
  { href: "/student/quizzes", label: "Danh sách bài thi", icon: AcademicCapIcon },
];

export const StudentNav = () => {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 border-b bg-white/70 px-6 py-4">
      <div className="flex items-center gap-4">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
              pathname.startsWith(link.href)
                ? "bg-indigo-100 text-indigo-700"
                : "text-gray-600 hover:bg-indigo-50"
            }`}
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </Link>
        ))}
      </div>
      <button
        className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        onClick={logout}
      >
        Đăng xuất
      </button>
    </nav>
  );
};

