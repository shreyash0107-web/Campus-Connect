import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { PAGE_SIZE } from "@/lib/constants";
import type { SearchParams } from "@/lib/data";

export function Pagination({ count, page, params, path }: { count: number; page: number; params: SearchParams; path: string }) {
  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  if (pages <= 1 && page === 1) return null;
  function href(value: number) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => { if (typeof val === "string" && key !== "page") query.set(key, val); });
    query.set("page", String(value));
    return `${path}?${query}`;
  }
  return <nav aria-label="Results pagination" className="mt-8 flex items-center justify-between gap-3">
    {page > 1 ? <Link href={href(page - 1)} className="btn btn-secondary"><ArrowLeft size={14} />Previous</Link> : <span />}
    <span className="text-xs text-muted">Page {page} of {pages}</span>
    {page < pages ? <Link href={href(page + 1)} className="btn btn-secondary">Next<ArrowRight size={14} /></Link> : <span />}
  </nav>;
}
