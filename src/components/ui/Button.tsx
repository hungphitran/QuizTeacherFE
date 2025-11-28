'use client';

import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";
import { Slot } from "@radix-ui/react-slot";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  asChild?: boolean;
}

export const Button = ({
  children,
  className,
  disabled,
  variant = "primary",
  asChild,
  ...props
}: Props) => {
  const base =
    "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variants: Record<Required<Props>["variant"], string> = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500",
    secondary:
      "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-300",
    ghost: "text-gray-600 hover:bg-gray-100 focus:ring-gray-200",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  };

  const Component = asChild ? Slot : "button";

  const sharedProps = {
    className: clsx(base, variants[variant], disabled && "opacity-60", className),
    "aria-disabled": asChild ? disabled : undefined,
    ...props,
  };

  return (
    <Component
      {...(!asChild ? { disabled } : {})}
      {...sharedProps}
    >
      {children}
    </Component>
  );
};

