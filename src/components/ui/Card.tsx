'use client';

import type { ReactNode } from "react";
import clsx from "clsx";

interface Props {
  children: ReactNode;
  className?: string;
}

export const Card = ({ children, className }: Props) => (
  <div className={clsx("rounded-xl border border-gray-200 bg-white p-6 shadow-sm", className)}>
    {children}
  </div>
);

