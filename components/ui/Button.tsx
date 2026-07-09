"use client";

import React from "react";
import clsx from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md";
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
        size === "md" ? "px-3.5 py-2 text-sm" : "px-2.5 py-1.5 text-xs",
        variant === "primary" &&
          "bg-brand-500 text-white hover:bg-brand-600 shadow-sm",
        variant === "outline" &&
          "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
        variant === "ghost" && "text-gray-600 hover:bg-gray-100",
        variant === "danger" && "bg-red-500 text-white hover:bg-red-600",
        className
      )}
      {...props}
    />
  );
}

export function IconButton({
  className,
  active,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center h-8 w-8 rounded-lg transition-colors",
        active ? "bg-brand-100 text-brand-700" : "text-gray-500 hover:bg-gray-100",
        className
      )}
      {...props}
    />
  );
}
