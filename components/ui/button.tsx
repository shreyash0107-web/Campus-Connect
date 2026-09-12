import type { ButtonHTMLAttributes } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
export function Button({ className, variant = "primary", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={cn("btn", `btn-${variant}`, className)} {...props} />;
}
export function ButtonLink({ href, children, variant = "primary", className }: {
  href: string; children: React.ReactNode; variant?: Variant; className?: string;
}) {
  return <Link href={href} className={cn("btn", `btn-${variant}`, className)}>{children}</Link>;
}
