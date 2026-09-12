import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
export function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "CC";
}
export function dateLabel(date: string) {
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(date));
}
export function safeNext(value: unknown, fallback = "/dashboard") {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") &&
    !/[\\\u0000-\u001f]/.test(value) && !value.startsWith("/auth") &&
    !value.startsWith("/login") && !value.startsWith("/signup") ? value : fallback;
}
export function searchPattern(value: string) {
  if (value.includes("*")) throw new Error("Use words or skill names rather than asterisks.");
  return `%${value.replace(/[\\%_]/g, "\\$&")}%`;
}
export function textArrayLiteral(values: string[]) {
  return `{${values.map((value) => `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`).join(",")}}`;
}
export function pageNumber(value: unknown) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? Math.min(page, 10000) : 1;
}
