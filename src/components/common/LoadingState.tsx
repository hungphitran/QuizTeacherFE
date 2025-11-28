'use client';

import { twMerge } from "tailwind-merge";

interface Props {
  label?: string;
  className?: string;
}

export const LoadingState = ({ label = "Đang tải...", className }: Props) => (
  <div
    className={twMerge(
      "flex w-full items-center justify-center py-10 text-sm text-gray-500",
      className,
    )}
  >
    <span className="animate-pulse">{label}</span>
  </div>
);

