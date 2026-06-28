"use client";

import React from "react";

type ButtonVariant = "primary" | "outlined" | "ghost" | "danger";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
  title?: string;
  type?: "button" | "submit" | "reset";
  className?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary text-on-primary-fixed hover:opacity-90",
  outlined: "border border-primary text-primary hover:bg-primary/10",
  ghost: "border border-outline-variant text-on-surface-variant hover:border-outline hover:text-on-surface",
  danger: "bg-error text-on-error hover:opacity-90",
};

export default function Button({
  children,
  onClick,
  variant = "primary",
  icon,
  loading = false,
  disabled = false,
  title,
  type = "button",
  className = "",
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      title={title}
      className={`flex items-center gap-sm font-bold px-lg py-3 rounded-lg transition-all active:scale-95 ${variantClasses[variant]} ${isDisabled ? "opacity-40 cursor-not-allowed active:scale-100" : ""} ${className}`}
    >
      {(icon || loading) && (
        <span className={`material-symbols-outlined ${loading ? "animate-spin" : ""}`}>
          {loading ? "progress_activity" : icon}
        </span>
      )}
      {children}
    </button>
  );
}
