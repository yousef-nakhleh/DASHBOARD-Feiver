import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

type ClassValue = string | number | boolean | undefined | null | { [key: string]: any } | ClassValue[];

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs));
}

/**
 * Formats a Date object to YYYY-MM-DD string using local date components
 * This avoids timezone conversion issues that occur with toISOString()
 */
export function formatDateToYYYYMMDDLocal(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}