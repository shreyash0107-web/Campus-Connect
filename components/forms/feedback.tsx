"use client";
import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import type { ActionState } from "@/lib/validation";

export function FormFeedback({ state }: { state: ActionState }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (state.error) { toast.error(state.error); ref.current?.focus(); }
    if (state.success) toast.success(state.success);
  }, [state]);
  if (!state.error && !state.success) return null;
  return <p ref={ref} tabIndex={-1} role={state.error ? "alert" : "status"} className={`rounded-lg border p-3 text-xs leading-6 ${state.error ? "border-red-100 bg-red-50 text-red-800" : "border-green-100 bg-green-50 text-green-800"}`}>{state.error || state.success}</p>;
}
export function SavedToast() {
  const params = useSearchParams();
  const router = useRouter();
  const shown = useRef(false);
  useEffect(() => {
    const saved = params.get("saved");
    if (!shown.current && (saved === "created" || saved === "updated")) {
      shown.current = true;
      toast.success(saved === "created" ? "Your opportunity is live." : "Opportunity updated.");
      const url = new URL(window.location.href);
      url.searchParams.delete("saved");
      router.replace(url.pathname + url.search, { scroll: false });
    }
  }, [params, router]);
  return null;
}
