import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = "default",
  ...props
}) => {
  const baseStyles = "px-4 py-2 text-sm font-medium rounded transition-colors";

  const variants = {
    default: "bg-black text-white hover:bg-zinc-800",
    outline: "border border-zinc-400 text-zinc-800 hover:bg-zinc-100",
    ghost: "text-zinc-800 hover:bg-zinc-100",
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
};