'use client';

import { ExclamationTriangleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/Button";

interface Props {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export const ErrorState = ({
  title = "Đã có lỗi xảy ra",
  description = "Vui lòng thử lại sau.",
  onRetry,
}: Props) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="rounded-full bg-red-100 p-3">
      <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
    </div>
    <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
    <p className="mt-2 text-sm text-gray-500 max-w-sm">{description}</p>
    {onRetry && (
      <Button variant="secondary" onClick={onRetry} className="mt-6 gap-2">
        <ArrowPathIcon className="h-4 w-4" />
        Thử lại
      </Button>
    )}
  </div>
);

