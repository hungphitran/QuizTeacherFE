'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardDocumentListIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/components/providers/AuthProvider";

const links = [
  { href: "/admin/quizzes", label: "Bài kiểm tra", icon: ClipboardDocumentListIcon },
];

export const AdminSidebar = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="flex w-64 flex-col border-r bg-white/70 px-4 py-6">
      <div className="flex items-center gap-3 border-b pb-4">
        <UserCircleIcon className="h-10 w-10 text-indigo-600" />
        <div>
          <p className="text-sm font-medium text-gray-900">{user?.full_name ?? user?.email}</p>
          <p className="text-xs text-gray-500">Quản trị viên</p>
        </div>
      </div>
      <nav className="mt-6 space-y-1">
        {links.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
              pathname.startsWith(item.href)
                ? "bg-indigo-100 text-indigo-700"
                : "text-gray-600 hover:bg-indigo-50"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      <button
        className="mt-auto rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        onClick={logout}
      >
        Đăng xuất
      </button>
    </aside>
  );
};

